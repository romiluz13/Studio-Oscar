import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import TopNavBar from "./components/TopNavBar";
import PostFeed from "./components/PostFeed";
import Profile from "./components/Profile";
import SignIn from "./components/SignIn";
import AddPost from "./components/AddPost";
import Calendar from "./components/Calendar";
import ErrorBoundary from "./components/ErrorBoundary";

const App: React.FC = () => {
  return (
    <Router>
      <div className="app flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white">
        <Toaster 
          position="top-center" 
          reverseOrder={false} 
          gutter={8}
          toastOptions={{
            duration: 5000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <TopNavBar />
        <ErrorBoundary>
          <main className="flex-grow p-4">
            <Routes>
              <Route path="/" element={<PostFeed />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/add-post" element={<AddPost />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/calendar" element={<Calendar />} />
            </Routes>
          </main>
        </ErrorBoundary>
        <footer className="bg-blue-600 text-white text-center py-4">
          © 2024 Studio Oscar. Bringing families closer through shared memories. 👨‍👩‍👧‍👦❤️
        </footer>
      </div>
    </Router>
  );
};

export default App;