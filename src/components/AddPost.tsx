import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import toast from 'react-hot-toast';
import { Camera, Upload } from 'lucide-react';

const AddPost: React.FC = () => {
  const [text, setText] = useState("");
  const [embedLink, setEmbedLink] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      toast.error('Please sign in to create a post.');
      return;
    }

    if (!text.trim()) {
      toast.error('Please add some text to your memory.');
      return;
    }

    try {
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        text,
        embedLink,
        createdAt: serverTimestamp(),
        likes: [],
        comments: []
      });

      toast.success('Memory shared successfully!');
      navigate("/");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error('Failed to share memory. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-post p-4 mx-auto max-w-2xl">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-800">Share a Family Memory</h2>
      <div className="mb-6 bg-white p-6 rounded-lg shadow-lg">
        <label htmlFor="memoryText" className="block text-sm font-medium text-gray-700 mb-2">
          Describe your memory
        </label>
        <textarea
          id="memoryText"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your wonderful memory..."
          className="w-full p-3 mb-4 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          required
        />
        <label htmlFor="embedLink" className="block text-sm font-medium text-gray-700 mb-2">
          Add a link (optional)
        </label>
        <input
          id="embedLink"
          type="url"
          value={embedLink}
          onChange={(e) => setEmbedLink(e.target.value)}
          placeholder="Add a link to a YouTube/Vimeo video or image"
          className="w-full p-3 mb-4 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition duration-300 flex items-center justify-center"
        >
          <Camera size={24} className="mr-2" />
          Share Memory
        </button>
      </div>
    </form>
  );
};

export default AddPost;