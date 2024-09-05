import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, User, LogOut, Camera, Calendar, PlusCircle, LogIn, Bot } from "lucide-react";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import toast from 'react-hot-toast';

const TopNavBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [auth]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully. Come back soon! 👋');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again. 😞');
    }
  };

  return (
    <nav className="top-nav bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg text-gray-800 p-4 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold flex items-center transition-transform duration-300 hover:scale-105 font-poppins">
          <Camera size={32} className="mr-2 text-primary" />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Studio Oscar</span>
        </Link>
        <div className="flex items-center space-x-6">
          <Link
            to="/"
            className={`flex flex-col items-center ${location.pathname === "/" ? "text-yellow-300" : "hover:text-yellow-300"} transition-colors duration-300`}
          >
            <Home size={24} />
            <span className="text-xs mt-1">Home</span>
          </Link>
          {user ? (
            <>
              <Link
                to="/calendar"
                className={`flex flex-col items-center ${location.pathname === "/calendar" ? "text-yellow-300" : "hover:text-yellow-300"} transition-colors duration-300`}
              >
                <Calendar size={24} />
                <span className="text-xs mt-1">Calendar</span>
              </Link>
              <Link
                to="/profile"
                className={`flex flex-col items-center ${location.pathname === "/profile" ? "text-yellow-300" : "hover:text-yellow-300"} transition-colors duration-300`}
              >
                <User size={24} />
                <span className="text-xs mt-1">Profile</span>
              </Link>
              <Link
                to="/langsam-gpt"
                className={`flex flex-col items-center ${location.pathname === "/langsam-gpt" ? "text-yellow-300" : "hover:text-yellow-300"} transition-colors duration-300`}
              >
                <Bot size={24} />
                <span className="text-xs mt-1">Langsam GPT</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex flex-col items-center hover:text-yellow-300 transition-colors duration-300"
              >
                <LogOut size={24} />
                <span className="text-xs mt-1">Sign Out</span>
              </button>
            </>
          ) : (
            <Link
              to="/signin"
              className="flex flex-col items-center hover:text-yellow-300 transition-colors duration-300"
            >
              <LogIn size={24} />
              <span className="text-xs mt-1">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopNavBar;