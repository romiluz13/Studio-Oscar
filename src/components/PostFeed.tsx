import React, { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, addDoc, Timestamp, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Heart, MessageCircle, Share2, PlusCircle, Tag, Search, Image, Youtube, Edit, Trash2, Gift, X, AlertCircle, Link } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useBeforeUnload } from "react-use";

interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  text: string;
  embedLink?: string;
  createdAt: Timestamp;
  likes: string[];
  comments: { 
    id: string; 
    userId: string; 
    userName: string; 
    text: string; 
    createdAt: Timestamp;
  }[];
  tags: string[];
  isBlessing: boolean;
  blessingText?: string;
  eventId?: string;
  mentions: string[];
}

interface Event {
  id: string;
  title: string;
  // ... other event fields ...
}

const PostFeed: React.FC = () => {
  console.log("PostFeed component is rendering");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ text: '', embedLink: '', tags: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showAddPost, setShowAddPost] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<{ postId: string; commentId: string } | null>(null);
  const [events, setEvents] = useState<{ [key: string]: Event }>({});
  const auth = getAuth();
  const [isDirty, setIsDirty] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareOptions, setShareOptions] = useState<Array<{ name: string, icon: React.ReactNode, action: () => void }>>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log("Current user:", currentUser);
    });

    const unsubscribe = onSnapshot(
      query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20)),
      (snapshot) => {
        const newPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];
        console.log("Fetched posts:", newPosts);
        setPosts(newPosts);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching posts:", error);
        setLoading(false);
        toast.error("Failed to load posts. Please try again.");
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribe();
    };
  }, [auth]);

  useEffect(() => {
    const fetchEventDetails = async (eventId: string) => {
      if (!events[eventId]) {
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (eventDoc.exists()) {
          setEvents(prev => ({ ...prev, [eventId]: { id: eventDoc.id, ...eventDoc.data() } as Event }));
        }
      }
    };

    posts.forEach(post => {
      if (post.eventId) {
        fetchEventDetails(post.eventId);
      }
    });
  }, [posts]);

  useEffect(() => {
    const savedDraft = localStorage.getItem('postDraft');
    if (savedDraft) {
      setNewPost(JSON.parse(savedDraft));
    }
  }, []);

  useEffect(() => {
    if (newPost.text || newPost.embedLink || newPost.tags) {
      localStorage.setItem('postDraft', JSON.stringify(newPost));
      setIsDirty(true);
    } else {
      localStorage.removeItem('postDraft');
      setIsDirty(false);
    }
  }, [newPost]);

  useBeforeUnload(isDirty, 'You have unsaved changes. Are you sure you want to leave?');

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const newPostRef = await addDoc(collection(db, "posts"), {
        userId: user.uid,
        userName: user.displayName,
        userPhotoURL: user.photoURL,
        text: newPost.text,
        embedLink: newPost.embedLink,
        createdAt: Timestamp.now(),
        likes: [],
        comments: [],
        tags: newPost.tags.split(',').map(tag => tag.trim()),
        isBlessing: false,
        mentions: [],
      });

      setNewPost({ text: '', embedLink: '', tags: '' });
      setShowAddPost(false);
      toast.success('Post added successfully!');
    } catch (error) {
      console.error("Error adding post: ", error);
      toast.error('Failed to add post. Please try again.');
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(match => match.slice(1)) : [];
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }

    const postRef = doc(db, "posts", postId);
    const post = posts.find(p => p.id === postId);

    if (post && Array.isArray(post.likes)) {
      if (post.likes.includes(user.uid)) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
      }
    } else {
      await updateDoc(postRef, {
        likes: [user.uid]
      });
    }
  };

  const handleComment = async (postId: string, commentText: string) => {
    if (!user) return;

    try {
      const postRef = doc(db, "posts", postId);
      const newComment = {
        id: Date.now().toString(),
        userId: user.uid,
        userName: user.displayName,
        text: commentText,
        createdAt: Timestamp.now(),
      };
      await updateDoc(postRef, {
        comments: arrayUnion(newComment),
      });
      setPosts(posts.map(post => post.id === postId ? { ...post, comments: [...post.comments, newComment] } : post));
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment. Please try again.');
    }
  };

  const handleEditPost = async (postId: string, newText: string, isBlessing: boolean) => {
    try {
      const postRef = doc(db, "posts", postId);
      if (isBlessing) {
        await updateDoc(postRef, { blessingText: newText });
        setPosts(posts.map(post => post.id === postId ? { ...post, blessingText: newText } : post));
      } else {
        await updateDoc(postRef, { text: newText });
        setPosts(posts.map(post => post.id === postId ? { ...post, text: newText } : post));
      }
      setEditingPost(null);
      toast.success('Post updated successfully');
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post. Please try again.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts(posts.filter(post => post.id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post. Please try again.');
    }
  };

  const handleEditComment = async (postId: string, commentId: string, newText: string) => {
    try {
      const postRef = doc(db, "posts", postId);
      const post = posts.find(p => p.id === postId);
      if (post) {
        const updatedComments = post.comments.map(comment =>
          comment.id === commentId ? { ...comment, text: newText } : comment
        );
        await updateDoc(postRef, { comments: updatedComments });
        setPosts(posts.map(p => p.id === postId ? { ...p, comments: updatedComments } : p));
        setEditingComment(null);
        toast.success('Comment updated successfully');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment. Please try again.');
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const postRef = doc(db, "posts", postId);
      const post = posts.find(p => p.id === postId);
      if (post) {
        const updatedComments = post.comments.filter(comment => comment.id !== commentId);
        await updateDoc(postRef, { comments: updatedComments });
        setPosts(posts.map(p => p.id === postId ? { ...p, comments: updatedComments } : p));
        toast.success('Comment deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment. Please try again.');
    }
  };

  const handleAddBlessing = async () => {
    if (!user) {
      toast.error('Please sign in to add a blessing.');
      return;
    }
    if (!newPost.text.trim()) {
      toast.error('Blessing content cannot be empty.');
      return;
    }
    try {
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL,
        text: '',
        createdAt: Timestamp.now(),
        likes: [],
        comments: [],
        tags: [],
        isBlessing: true,
        blessingText: newPost.text,
      });
      setNewPost({ text: '', embedLink: '', tags: '' });
      setShowAddPost(false);
      toast.success('Blessing added successfully! 🙏');
    } catch (error) {
      console.error('Error adding blessing:', error);
      toast.error('Failed to add blessing. Please try again.');
    }
  };

  const renderEmbed = (embedLink: string) => {
    if (embedLink.includes('youtube.com') || embedLink.includes('youtu.be')) {
      const videoId = embedLink.includes('youtube.com') ? embedLink.split('v=')[1] : embedLink.split('/').pop();
      return (
        <iframe
          width="100%"
          height="315"
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      );
    } else if (embedLink.includes('vimeo.com')) {
      const videoId = embedLink.split('/').pop();
      return (
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          width="100%"
          height="315"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        ></iframe>
      );
    } else {
      return <img src={embedLink} alt="Embedded content" className="w-full h-auto rounded-lg" />;
    }
  };

  const filteredPosts = posts.filter(post => 
    post.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleShare = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const postUrl = `${window.location.origin}/#/post/${postId}`;
    let shareText = `בוא לראות את הזיכרון המשפחתי הזה: ${post.text}`;

    if (post.embedLink) {
      if (post.embedLink.includes('youtube.com') || post.embedLink.includes('youtu.be')) {
        shareText += `\n\nצפה בסרטון: ${post.embedLink}`;
      } else if (post.embedLink.includes('vimeo.com')) {
        shareText += `\n\nצפה בסרטון: ${post.embedLink}`;
      } else {
        shareText += `\n\nצפה בתמונה: ${post.embedLink}`;
      }
    }

    shareText += `\n\nקישור לפוסט: ${postUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    setShareOptions([
      { 
        name: 'שתף בוואטסאפ', 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#25D366" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>, 
        action: () => window.open(whatsappUrl, '_blank')
      },
      { 
        name: 'העתק קישור', 
        icon: <Link size={24} color="#4267B2" />, 
        action: () => copyToClipboard(postUrl)
      }
    ]);
    setShowShareModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('הקישור הועתק ללוח!', {
        icon: '📋',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    }, () => {
      toast.error('שגיאה בהעתקת הקישור', {
        icon: '❌',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    });
  };

  const ShareModal = ({ options, onClose }: { options: Array<{ name: string, icon: React.ReactNode, action: () => void }>, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold mb-4 text-center text-blue-800">שתף זיכרון</h3>
        <div className="space-y-3">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                option.action();
                onClose();
              }}
              className="w-full flex items-center justify-between py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition duration-300 shadow-md"
            >
              <span className="font-semibold">{option.name}</span>
              {option.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="post-feed p-4 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-800 font-poppins">
          Family Moments
        </h1>

        {user && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <button
              onClick={() => setShowAddPost(!showAddPost)}
              className="w-full bg-gradient-to-r from-blue-500 to-green-400 text-white p-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition duration-300 flex items-center justify-center font-poppins"
            >
              <PlusCircle size={24} className="mr-2" />
              Share a Family Moment
            </button>

            <AnimatePresence>
              {showAddPost && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 bg-white rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="p-6">
                    <textarea
                      value={newPost.text}
                      onChange={(e) => setNewPost({ ...newPost, text: e.target.value })}
                      placeholder="What's your family up to?"
                      className="w-full p-4 mb-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-inter"
                      rows={3}
                    />
                    <div className="flex space-x-2 mb-4">
                      <input
                        type="text"
                        value={newPost.embedLink}
                        onChange={(e) => setNewPost({ ...newPost, embedLink: e.target.value })}
                        placeholder="Add a link to media (YouTube, Vimeo, image)"
                        className="flex-grow p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-inter"
                      />
                      <button className="bg-blue-500 text-white p-4 rounded-xl hover:bg-blue-600 transition duration-300">
                        <Image size={20} />
                      </button>
                      <button className="bg-red-500 text-white p-4 rounded-xl hover:bg-red-600 transition duration-300">
                        <Youtube size={20} />
                      </button>
                    </div>
                    <div className="flex items-center mb-4">
                      <Tag size={20} className="text-blue-500 mr-2" />
                      <input
                        type="text"
                        value={newPost.tags}
                        onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                        placeholder="Add tags (comma-separated)"
                        className="flex-grow p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-inter"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddPost}
                        className="flex-1 bg-gradient-to-r from-green-400 to-blue-500 text-white p-4 rounded-xl hover:shadow-lg hover:scale-105 transition duration-300 flex items-center justify-center font-poppins"
                      >
                        <PlusCircle size={20} className="mr-2" />
                        Post Moment
                      </button>
                      <button
                        onClick={handleAddBlessing}
                        className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-xl hover:shadow-lg hover:scale-105 transition duration-300 flex items-center justify-center font-poppins"
                      >
                        <Gift size={20} className="mr-2" />
                        Add Blessing
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="bg-white rounded-xl p-4 shadow-lg flex items-center mb-6">
          <Search size={20} className="text-gray-400 mr-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search posts and tags..."
            className="flex-grow p-2 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg font-inter"
          />
        </div>

        <AnimatePresence>
          {filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {post.userPhotoURL ? (
                    <img src={post.userPhotoURL} alt={post.userName} className="w-12 h-12 rounded-full mr-3 border-2 border-blue-500" />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-400 rounded-full flex items-center justify-center text-white font-bold text-xl mr-3">
                      {post.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 className="font-bold text-lg text-gray-800 font-poppins">{post.userName}</h3>
                </div>
                {user && user.uid === post.userId && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingPost(post.id)}
                      className="text-blue-500 hover:text-blue-700 transition duration-300"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-500 hover:text-red-700 transition duration-300"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </div>
              {editingPost === post.id ? (
                <div className="mt-2">
                  <textarea
                    defaultValue={post.isBlessing ? post.blessingText : post.text}
                    className="w-full p-2 border border-gray-300 rounded-lg mb-2"
                    rows={4}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                        handleEditPost(post.id, textarea.value, post.isBlessing);
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition duration-300"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPost(null)}
                      className="bg-gray-300 text-gray-800 px-3 py-1 rounded-lg text-sm hover:bg-gray-400 transition duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {post.isBlessing ? (
                    <div className="mb-4">
                      <Gift size={24} className="text-yellow-500 mb-2" />
                      <p className="text-lg text-gray-700 italic font-inter whitespace-pre-wrap">{post.blessingText}</p>
                      {post.eventId && events[post.eventId] && (
                        <p className="text-sm text-blue-500 mt-2 font-semibold">
                          Blessing for: {events[post.eventId].title}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="mb-4 text-lg text-gray-700 font-inter whitespace-pre-wrap">{post.text}</p>
                      {post.embedLink && (
                        <div className="embed-container mb-4 rounded-xl overflow-hidden">
                          {renderEmbed(post.embedLink)}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags && post.tags.map((tag, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-inter">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
              <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center ${post.likes && post.likes.includes(user?.uid || '') ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition duration-300`}
                >
                  <Heart size={20} className="mr-1" />
                  <span>{post.likes ? post.likes.length : 0}</span>
                </button>
                <div className="flex items-center text-gray-500">
                  <MessageCircle size={20} className="mr-1" />
                  <span>{post.comments ? post.comments.length : 0}</span>
                </div>
                <button
                  onClick={() => handleShare(post.id)}
                  className="flex items-center text-blue-500 hover:text-blue-600 transition duration-300"
                >
                  <Share2 size={20} className="mr-1" />
                  Share
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {post.comments && post.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-sm text-gray-800 font-poppins">{comment.userName}</p>
                      {user && user.uid === comment.userId && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingComment({ postId: post.id, commentId: comment.id })}
                            className="text-blue-500 hover:text-blue-700 transition duration-300"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(post.id, comment.id)}
                            className="text-red-500 hover:text-red-700 transition duration-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingComment && editingComment.postId === post.id && editingComment.commentId === comment.id ? (
                      <div className="mt-2">
                        <textarea
                          defaultValue={comment.text}
                          className="w-full p-2 border border-gray-300 rounded-lg mb-2"
                          rows={2}
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                              handleEditComment(post.id, comment.id, textarea.value);
                            }}
                            className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition duration-300"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingComment(null)}
                            className="bg-gray-300 text-gray-800 px-3 py-1 rounded-lg text-sm hover:bg-gray-400 transition duration-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 font-inter whitespace-pre-wrap">{comment.text}</p>
                    )}
                  </div>
                ))}
              </div>
              {user && (
                <div className="mt-4 flex">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="flex-grow mr-2 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-inter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleComment(post.id, e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector(`input[placeholder="Add a comment..."]`) as HTMLInputElement;
                      if (input) {
                        handleComment(post.id, input.value);
                        input.value = '';
                      }
                    }}
                    className="bg-gradient-to-r from-blue-500 to-green-400 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition duration-300 font-poppins"
                  >
                    Comment
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {showShareModal && (
          <ShareModal
            options={shareOptions}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostFeed;