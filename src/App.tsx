/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { Toaster } from 'sonner';

// Pages
import LandingPage from './pages/LandingPage';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import CreateSession from './pages/CreateSession';
import Matching from './pages/Matching';
import MatchResult from './pages/MatchResult';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';

// Components
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-orange-500/30">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/home" /> : <LandingPage />} />
            <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/" />} />
            
            <Route element={<Layout />}>
              <Route path="/home" element={user ? <Home /> : <Navigate to="/" />} />
              <Route path="/create-session" element={user ? <CreateSession /> : <Navigate to="/" />} />
              <Route path="/matching/:sessionId" element={user ? <Matching /> : <Navigate to="/" />} />
              <Route path="/match-result/:matchId" element={user ? <MatchResult /> : <Navigate to="/" />} />
              <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
              <Route path="/edit-profile" element={user ? <EditProfile /> : <Navigate to="/" />} />
              <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
              <Route path="/admin" element={user && user.email === 'elbadaouimohamedaziz49@gmail.com' ? <AdminDashboard /> : <Navigate to="/home" />} />
            </Route>
          </Routes>
          <Toaster position="top-center" theme="dark" closeButton />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
