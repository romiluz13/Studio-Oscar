import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { getAuth, signOut, updateProfile } from "firebase/auth";
import { db, storage } from "../firebase";
import { useNavigate } from "react-router-dom";
import { LogOut, Trash2, Camera, Upload } from "lucide-react";
import toast from 'react-hot-toast';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Post {
  id: string;
  text: string;
  embedLink?: string;
  createdAt: any;
  likes: string[];
  comments: { userId: string; userName: string; text: string }[];
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const postsQuery = query(
          collection(db, "posts"),
          where("userId", "==", currentUser.uid)
        );

        const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
          const userPosts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Post[];
          setPosts(userPosts);
        });

        return () => unsubscribePosts();
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully. Come back soon!');
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error('Oops! Something went wrong. Please try again.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm("Are you sure you want to delete this memory? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "posts", postId));
        toast.success('Memory deleted successfully.');
      } catch (error) {
        console.error("Error deleting post:", error);
        toast.error('Failed to delete memory. Please try again.');
      }
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
      const file = e.target.files[0];
      setProfilePic(file);

      const storageRef = ref(storage, `profile-pics/${user.uid}`);
      try {
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        await updateProfile(user, { photoURL: downloadURL });
        toast.success('Profile picture updated successfully!');
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        toast.error('Failed to update profile picture. Please try again.');
      }
    }
  };

  const renderEmbed = (embedLink: string) => {
    if (embedLink.includes('youtube.com') || embedLink.includes('youtu.be')) {
      const videoId = embedLink.includes('youtube.com') ? embedLink.split('v=')[1] : embedLink.split('/').pop();
      return (
        <iframe
          width="100%"
          height="200"
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
          height="200"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        ></iframe>
      );
    } else {
      return <img src={embedLink} alt="Embedded content" className="w-full h-auto rounded-lg" />;
    }
  };

  if (!user) {
    return (
      <div className="profile p-4 text-center bg-gradient-to-b from-blue-100 to-blue-200 min-h-screen">
        <h2 className="text-2xl font-bold mb-4 text-blue-800">Profile</h2>
        <p className="mb-4 text-blue-600">Please sign in to view your profile.</p>
        <button
          onClick={() => navigate("/signin")}
          className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition duration-300 shadow-lg"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="profile p-4 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800 font-poppins">Your Family Album</h2>
          <button
            onClick={handleSignOut}
            className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-full flex items-center hover:shadow-lg transition duration-300 font-poppins"
          >
            <LogOut size={18} className="mr-2" />
            Sign Out
          </button>
        </div>
        <div className="mb-6 flex items-center">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full mr-4 border-4 border-blue-500" />
          ) : (
            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold mr-4">
              {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
            </div>
          )}
          <div>
            <h3 className="text-2xl font-semibold text-blue-800">{user.displayName}</h3>
            <p className="text-blue-600">{user.email}</p>
            <label className="cursor-pointer mt-2 inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300">
              <Upload size={18} className="mr-2" />
              Update Profile Picture
              <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" />
            </label>
          </div>
        </div>
        <h3 className="text-2xl font-semibold mb-4 text-blue-700">Your Shared Memories</h3>
        {posts.length === 0 ? (
          <p className="text-blue-600">You haven't shared any memories yet. Time to start capturing those special moments!</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-blue-50 rounded-lg p-4 mb-4 shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <p className="text-lg mb-2 text-gray-700">{post.text}</p>
              {post.embedLink && (
                <div className="embed-container mb-2 rounded-lg overflow-hidden">
                  {renderEmbed(post.embedLink)}
                </div>
              )}
              <div className="flex justify-between items-center text-sm text-blue-600">
                <span>Likes: {post.likes ? post.likes.length : 0}</span>
                <span>Comments: {post.comments ? post.comments.length : 0}</span>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="text-red-500 hover:text-red-700 transition duration-300"
                  title="Delete Memory"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;