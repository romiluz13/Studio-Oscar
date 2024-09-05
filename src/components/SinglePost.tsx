import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Heart, MessageCircle, Share2, Copy, Check, ArrowLeft } from "lucide-react";
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from "framer-motion";

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
  tags: string[];
  isBlessing: boolean;
  blessingText?: string;
}

const SinglePost: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const location = useLocation();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      let id = postId;
      if (!id) {
        const hash = location.hash;
        const match = hash.match(/\/post\/(.+)$/);
        if (match) {
          id = match[1];
        }
      }
      
      if (!id) {
        console.log("No post ID found");
        setLoading(false);
        return;
      }
      
      try {
        const postDoc = await getDoc(doc(db, "posts", id));
        if (postDoc.exists()) {
          const postData = { id: postDoc.id, ...postDoc.data() } as Post;
          console.log("Fetched post data:", postData);
          setPost(postData);
        } else {
          console.log("No such post!");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, location]);

  const handleShare = () => {
    setShowShareOptions(true);
  };

  const handleWhatsAppShare = () => {
    const postUrl = `${window.location.origin}/#/post/${post?.id}`;
    let shareText = `בוא לראות את הזיכרון המשפחתי הזה: ${post?.text}`;
    shareText += `\n\nקישור לפוסט: ${postUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/#/post/${post?.id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      setIsCopied(true);
      toast.success('הקישור הועתק ללוח!');
      setTimeout(() => setIsCopied(false), 3000);
    }, () => {
      toast.error('שגיאה בהעתקת הקישור');
    });
  };

  const renderEmbed = (embedLink: string) => {
    console.log("Rendering embed for link:", embedLink);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="single-post p-4 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition duration-300">
          <ArrowLeft size={24} className="mr-2" />
          View All Posts
        </Link>
        <div className="flex items-center mb-4">
          {post.userPhotoURL ? (
            <img src={post.userPhotoURL} alt={post.userName} className="w-12 h-12 rounded-full mr-3 border-2 border-blue-500" />
          ) : (
            <div className="w-12 h-12 bg-blue-500 rounded-full mr-3 flex items-center justify-center text-white font-bold text-xl">
              {post.userName.charAt(0).toUpperCase()}
            </div>
          )}
          <h2 className="text-2xl font-semibold text-gray-800">{post.userName}</h2>
        </div>
        {post.isBlessing ? (
          <p className="text-xl italic mb-6 text-gray-700">{post.blessingText}</p>
        ) : (
          <p className="text-xl mb-6 text-gray-700">{post.text}</p>
        )}
        {post.embedLink && (
          <div className="mb-6">
            {renderEmbed(post.embedLink)}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags && post.tags.map((tag: string, index: number) => (
            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex justify-between items-center text-gray-600 mb-6">
          <div className="flex items-center">
            <Heart size={24} className="mr-2 text-red-500" />
            <span className="text-lg">{post.likes.length}</span>
          </div>
          <div className="flex items-center">
            <MessageCircle size={24} className="mr-2 text-blue-500" />
            <span className="text-lg">{post.comments.length}</span>
          </div>
          <button 
            onClick={handleShare} 
            className="flex items-center text-blue-600 hover:text-blue-800 transition duration-300"
          >
            <Share2 size={24} className="mr-2" />
            Share
          </button>
        </div>
        <div className="comments mt-8">
          <h3 className="text-2xl font-semibold mb-4 text-gray-800">Comments</h3>
          {post.comments && post.comments.map((comment: { id: string; userName: string; text: string }) => (
            <div key={comment.id} className="bg-gray-50 p-4 rounded-lg mb-4 shadow">
              <p className="font-semibold text-gray-800 mb-2">{comment.userName}</p>
              <p className="text-gray-700">{comment.text}</p>
            </div>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {showShareOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowShareOptions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4 text-center text-gray-800">Share this memory</h3>
              <div className="space-y-4">
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full flex items-center justify-between py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300"
                >
                  <span className="font-semibold">Share on WhatsApp</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#fff" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-between py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
                >
                  <span className="font-semibold">Copy Link</span>
                  {isCopied ? <Check size={24} /> : <Copy size={24} />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SinglePost;