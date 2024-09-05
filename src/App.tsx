import React, { useState, useEffect } from "react";
import { HashRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import TopNavBar from "./components/TopNavBar";
import Spinner from "./components/Spinner";
import ErrorBoundary from "./components/ErrorBoundary"; // Add this import
import { Suspense, lazy } from "react";
import FastbotsChat from './components/FastbotsChat';

const LazyPostFeed = lazy(() => import("./components/PostFeed"));
const LazyProfile = lazy(() => import("./components/Profile"));
const LazyAddPost = lazy(() => import("./components/AddPost"));
const LazySignIn = lazy(() => import("./components/SignIn"));
const LazyCalendar = lazy(() => import("./components/Calendar"));
const LazySinglePost = lazy(() => import("./components/SinglePost"));
import { auth } from './firebase';
const LazyLangsamGPT = lazy(() => import("./components/LangsamGPT"));

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <Router>
      <ErrorBoundary>
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
          <Suspense fallback={<Spinner />}>
            <main className="flex-grow p-4">
              <Routes>
                <Route path="/" element={user ? <LazyPostFeed /> : <Navigate to="/signin" />} />
                <Route path="/profile" element={user ? <LazyProfile /> : <Navigate to="/signin" />} />
                <Route path="/add-post" element={user ? <LazyAddPost /> : <Navigate to="/signin" />} />
                <Route path="/signin" element={<LazySignIn />} />
                <Route path="/calendar" element={user ? <LazyCalendar /> : <Navigate to="/signin" />} />
                <Route path="/post/:postId" element={<LazySinglePost />} />
                <Route path="/langsam-gpt" element={<LazyLangsamGPT />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </Suspense>
          <footer className="bg-blue-600 text-white text-center py-4">
            © 2024 Studio Oscar. Bringing families closer through shared memories. 👨‍‍👧‍👦❤️
          </footer>
        </div>
      </ErrorBoundary>
    </Router>
  );
};

export default App;