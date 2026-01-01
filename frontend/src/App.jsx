import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import styles from './index.css';

// Pages
import Dashboard from './pages/Dashboard';
import StudyPlanner from './pages/StudyPlanner';
import Resources from './pages/Resources';
import Analytics from './pages/Analytics';
import TopicDetail from './pages/TopicDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Components
import Sidebar from './components/Sidebar';
import ChatWidget from './components/ChatWidget';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20%' }}>Loading...</div>;

  return user ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => {
  const location = useLocation();
  // Don't show sidebar/chat on auth pages
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {!isAuthPage && <Sidebar />}
      <main style={{
        flex: 1,
        padding: isAuthPage ? '2rem' : '2rem 3rem',
        marginLeft: isAuthPage ? 0 : '250px', // Match sidebar width
        maxWidth: '1600px'
      }}>
        {children}
      </main>
      {!isAuthPage && <ChatWidget />}
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Private Routes */}
        <Route path="/" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/planner" element={
          <PrivateRoute>
            <StudyPlanner />
          </PrivateRoute>
        } />
        <Route path="/resources" element={
          <PrivateRoute>
            <Resources />
          </PrivateRoute>
        } />
        <Route path="/analytics" element={
          <PrivateRoute>
            <Analytics />
          </PrivateRoute>
        } />
        <Route path="/topic/:id" element={
          <PrivateRoute>
            <TopicDetail />
          </PrivateRoute>
        } />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
