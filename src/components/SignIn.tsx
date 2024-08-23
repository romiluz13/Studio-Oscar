import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { Camera, Coffee } from 'lucide-react';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (error) {
      console.error("Error signing in with Google:", error);
      if (error instanceof Error) {
        setError(`Sign-in error: ${error.message}`);
      } else {
        setError("An unknown error occurred during sign-in");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sign-in min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full transform hover:scale-105 transition-transform duration-300">
        <div className="flex justify-center mb-6">
          <Camera size={48} className="text-blue-600 animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-800">Welcome to Studio Oscar</h2>
        <p className="text-gray-600 mb-8 text-center">
          Where family memories meet their digital home! Ready to capture some moments?
        </p>
        <div className="mb-8 bg-blue-100 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Quick Start Guide:</h3>
          <ol className="list-decimal list-inside text-blue-700">
            <li>Click the fancy Google button below</li>
            <li>Grant us access (we promise we're not nosy)</li>
            <li>Start sharing your family's precious moments!</li>
          </ol>
        </div>
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className={`w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <Coffee className="animate-spin mr-2" />
          ) : (
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google logo"
              className="w-6 h-6 mr-2"
            />
          )}
          {isLoading ? 'Creating your family album...' : 'Sign in with Google'}
        </button>
        {error && (
          <p className="mt-4 text-red-500 text-center">{error}</p>
        )}
        <p className="mt-6 text-sm text-gray-500 text-center">
          By signing in, you agree to our Terms of Service and Privacy Policy. No embarrassing family photos were harmed in the making of this app.
        </p>
      </div>
    </div>
  );
};

export default SignIn;