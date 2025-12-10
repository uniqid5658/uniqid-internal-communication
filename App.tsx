import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MaterialsPage } from './pages/Materials';
import { SchedulesPage } from './pages/Schedules';
import { MeetingsPage } from './pages/Meetings';
import { ProjectsPage } from './pages/Projects';
import { SettingsPage } from './pages/Settings';
import { DeliveryPage } from './pages/Delivery';
import { Loader2, AlertTriangle } from 'lucide-react';

// --- ERROR BOUNDARY ---
// Catches render errors to prevent white screens
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Application Error</h2>
            <p className="text-gray-500 mb-6 text-sm">
              The application encountered an unexpected error. This is usually caused by outdated data stored in your browser or a connection issue.
            </p>
            
            <div className="bg-gray-50 p-3 rounded text-left mb-6 overflow-auto max-h-32">
                <p className="text-xs font-mono text-red-500 break-words">{this.state.error?.message}</p>
            </div>

            <button 
              onClick={this.handleReset}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Data & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper to prevent access to login page if already logged in
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/" /> : <>{children}</>;
};

const AppRoutes = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/materials" element={<Layout><MaterialsPage /></Layout>} />
      <Route path="/schedules" element={<Layout><SchedulesPage /></Layout>} />
      <Route path="/meetings" element={<Layout><MeetingsPage /></Layout>} />
      <Route path="/projects" element={<Layout><ProjectsPage /></Layout>} />
      <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
      <Route path="/delivery" element={<Layout><DeliveryPage /></Layout>} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;