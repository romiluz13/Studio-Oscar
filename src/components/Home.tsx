import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Share2, PlusCircle, Edit2, Trash2 } from "lucide-react";
import toast from 'react-hot-toast';

interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  text: string;
  embedLink?: string;
  createdAt: any;
  likes: string[];
  comments: { id: string; userId: string; userName: string; text: string; createdAt: any }[];
}

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<{ postId: string; commentId: string } | null>(null);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const newPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      setPosts(newPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const handleComment = async (postId: string) => {
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    const postRef = doc(db, "posts", postId);
    const newCommentObj = {
      id: Date.now().toString(),
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      text: newComment.trim(),
      createdAt: new Date()
    };

    await updateDoc(postRef, {
      comments: arrayUnion(newCommentObj)
    });

    setNewComment("");
    toast.success('Comment added successfully');
  };

  const handleEditComment = async (postId: string, commentId: string, newText: string) => {
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    const post = postSnap.data() as Post;

    const updatedComments = post.comments.map(comment => 
      comment.id === commentId ? { ...comment, text: newText } : comment
    );

    await updateDoc(postRef, { comments: updatedComments });
    setEditingComment(null);
    toast.success('Comment updated successfully');
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    const post = postSnap.data() as Post;

    const updatedComments = post.comments.filter(comment => comment.id !== commentId);

    await updateDoc(postRef, { comments: updatedComments });
    toast.success('Comment deleted successfully');
  };

  const handleShare = async (postId: string) => {
    const postUrl = `${window.location.origin}/post/${postId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this family memory!',
          text: 'I wanted to share this family memory with you.',
          url: postUrl,
        });
        toast.success('Shared successfully!');
      } catch (error) {
        console.error('Error sharing:', error);
        fallbackShare(postUrl);
      }
    } else {
      fallbackShare(postUrl);
    }
  };

  const fallbackShare = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!');
    }, () => {
      toast.error('Failed to copy link');
    });
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

  if (loading) return <div className="text-center p-4 text-blue-600">Loading...</div>;

  return (
    <div className="home p-4">
      <h1 className="text-4xl font-bold mb-6 text-center text-blue-800">Family Memories</h1>
      {user && (
        <Link
          to="/add-post"
          className="block w-full max-w-md mx-auto mb-6 bg-blue-500 text-white text-center py-3 rounded-full hover:bg-blue-600 transition duration-300 shadow-lg"
        >
          <PlusCircle size={24} className="inline-block mr-2" />
          Share a New Memory
        </Link>
      )}
      <div className="max-w-2xl mx-auto space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-4">
              {post.userPhotoURL ? (
                <img src={post.userPhotoURL} alt={post.userName} className="w-10 h-10 rounded-full mr-3" />
              ) : (
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-3">
                  {post.userName.charAt(0).toUpperCase()}
                </div>
              )}
              <h3 className="font-bold text-lg text-blue-800">{post.userName}</h3>
            </div>
            <p className="mb-4 text-lg text-gray-700">{post.text}</p>
            {post.embedLink && (
              <div className="embed-container mb-4 rounded-lg overflow-hidden">
                {renderEmbed(post.embedLink)}
              </div>
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
                <div key={comment.id} className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-sm text-blue-800">{comment.userName}</p>
                    {user && user.uid === comment.userId && (
                      <div className="flex space-x-2">
                        <button onClick={() => setEditingComment({ postId: post.id, commentId: comment.id })} className="text-blue-500 hover:text-blue-700">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteComment(post.id, comment.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  {editingComment && editingComment.postId === post.id && editingComment.commentId === comment.id ? (
                    <div className="mt-2">
                      <input
                        type="text"
                        defaultValue={comment.text}
                        className="w-full p-2 border border-blue-300 rounded"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleEditComment(post.id, comment.id, e.currentTarget.value);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  )}
                </div>
              ))}
            </div>
            {user && (
              <div className="mt-4 flex">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-grow mr-2 p-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleComment(post.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                >
                  Comment
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;