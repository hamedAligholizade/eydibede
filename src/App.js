import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import CreateGroup from './components/CreateGroup';
import GroupDetails from './components/GroupDetails';
import ParticipantDetails from './components/ParticipantDetails';
import AdminParticipantView from './components/AdminParticipantView';
import AdminRegistration from './components/AdminRegistration';
import AdminLogin from './components/AdminLogin';
import AddParticipant from './components/AddParticipant';
import './App.css';

function App() {
  const [needsAdminSetup, setNeedsAdminSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAdminSetup();
    checkAuthentication();
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

  const checkAuthentication = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setIsAuthenticated(false);
      setIsCheckingAuth(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    
    if (isCheckingAuth) {
      return <div className="text-center mt-8">در حال بررسی وضعیت ورود...</div>;
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/admin/login" state={{ from: location.pathname }} />;
    }
    
    return children;
  };

  if (checkingSetup || isCheckingAuth) {
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
            <Route path="/groups/:id/add-participant" element={
              <ProtectedRoute>
                <AddParticipant />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
