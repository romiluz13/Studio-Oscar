import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Post } from "./PostFeed"; // Import the Post interface
import { Heart, MessageCircle, Share2 } from "lucide-react";

const SinglePost: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (postId) {
        const postDoc = await getDoc(doc(db, "posts", postId));
        if (postDoc.exists()) {
          setPost({ id: postDoc.id, ...postDoc.data() } as Post);
        }
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="single-post p-4 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center mb-4">
          {post.userPhotoURL ? (
            <img src={post.userPhotoURL} alt={post.userName} className="w-12 h-12 rounded-full mr-3 border-2 border-blue-500" />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-400 rounded-full flex items-center justify-center text-white font-bold text-xl mr-3">
              {post.userName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-800">{post.userName}'s Memory</h1>
        </div>
        {post.isBlessing ? (
          <div className="mb-4">
            <p className="text-lg text-gray-700 italic font-inter whitespace-pre-wrap">{post.blessingText}</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-lg text-gray-700 font-inter whitespace-pre-wrap">{post.text}</p>
            {post.embedLink && (
              <div className="embed-container mb-4 rounded-xl overflow-hidden">
                {renderEmbed(post.embedLink)}
              </div>
            )}
          </>
        )}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags && post.tags.map((tag, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-inter">
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center text-gray-500">
            <Heart size={20} className="mr-1" />
            <span>{post.likes ? post.likes.length : 0}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <MessageCircle size={20} className="mr-1" />
            <span>{post.comments ? post.comments.length : 0}</span>
          </div>
          <div className="flex items-center text-blue-500">
            <Share2 size={20} className="mr-1" />
            <span>Share</span>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {post.comments && post.comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 p-4 rounded-xl">
              <p className="font-bold text-sm text-gray-800 font-poppins">{comment.userName}</p>
              <p className="text-sm text-gray-700 font-inter whitespace-pre-wrap">{comment.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SinglePost;