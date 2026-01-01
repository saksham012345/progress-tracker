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
import Settings from './pages/Settings';

// Components
import Sidebar from './components/Sidebar';
import ChatWidget from './components/ChatWidget';
import AnimatedBackground from './components/AnimatedBackground';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20%' }}>Loading...</div>;

  return user ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    if (isMobile) setMobileSidebarOpen(false);
  }, [location, isMobile]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <AnimatedBackground />

      {/* Mobile Hamburger */}
      {!isAuthPage && isMobile && (
        <button
          onClick={() => setMobileSidebarOpen(true)}
          style={{
            position: 'fixed', top: '20px', left: '20px', zIndex: 60,
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '8px',
            backdropFilter: 'blur(12px)', color: 'var(--text-primary)'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      )}

      {/* Sidebar - Pass mobile state */}
      {!isAuthPage && (
        <Sidebar
          isMobile={isMobile}
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
      )}

      <main style={{
        flex: 1,
        padding: isAuthPage || isMobile ? '2rem 1.5rem' : '2rem 3rem', // Less padding on mobile
        marginLeft: isAuthPage || isMobile ? 0 : '280px', // No margin on mobile
        marginTop: isMobile && !isAuthPage ? '60px' : '0', // Space for hamburger
        maxWidth: '1600px',
        position: 'relative',
        width: '100%', // Ensure full width
        zIndex: 10
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
        <Route path="/settings" element={
          <PrivateRoute>
            <Settings />
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
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
