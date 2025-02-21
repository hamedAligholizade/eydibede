import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import CreateGroup from './components/CreateGroup';
import GroupDetails from './components/GroupDetails';
import ParticipantDetails from './components/ParticipantDetails';
import AdminParticipantView from './components/AdminParticipantView';
import AdminRegistration from './components/AdminRegistration';
import AdminLogin from './components/AdminLogin';
import './App.css';

function App() {
  const [needsAdminSetup, setNeedsAdminSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAdminSetup();
    const token = localStorage.getItem('adminToken');
    setIsAuthenticated(!!token);
  }, []);

  const checkAdminSetup = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/check-setup`);
      const data = await response.json();
      setNeedsAdminSetup(data.needsSetup);
    } catch (error) {
      console.error('Failed to check admin setup:', error);
    } finally {
      setCheckingSetup(false);
    }
  };

  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/admin/login" />;
    }
    return children;
  };

  if (checkingSetup) {
    return <div className="text-center mt-8">در حال بارگذاری...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={
              needsAdminSetup ? <Navigate to="/admin/register" /> : <Home />
            } />
            <Route path="/admin/register" element={<AdminRegistration />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/create-group" element={
              <ProtectedRoute>
                <CreateGroup />
              </ProtectedRoute>
            } />
            <Route path="/groups/:id" element={
              <ProtectedRoute>
                <GroupDetails />
              </ProtectedRoute>
            } />
            <Route path="/groups/:groupId/participant/:participantId" element={
              <ProtectedRoute>
                <AdminParticipantView />
              </ProtectedRoute>
            } />
            <Route path="/participant/:id" element={<ParticipantDetails />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
