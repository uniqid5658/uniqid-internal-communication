import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MaterialsPage } from './pages/Materials';
import { SchedulesPage } from './pages/Schedules';
import { MeetingsPage } from './pages/Meetings';

// Wrapper to prevent access to login page if already logged in
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/" /> : <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/materials" element={<Layout><MaterialsPage /></Layout>} />
      <Route path="/schedules" element={<Layout><SchedulesPage /></Layout>} />
      <Route path="/meetings" element={<Layout><MeetingsPage /></Layout>} />
      <Route path="/projects" element={<Layout><div className="p-4 text-gray-500">Projects module placeholder</div></Layout>} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
