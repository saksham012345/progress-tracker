import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

// Pages
import Dashboard from './pages/Dashboard';
import StudyPlanner from './pages/StudyPlanner';
import Resources from './pages/Resources';
import Analytics from './pages/Analytics';
import TopicDetail from './pages/TopicDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import Workspaces from './pages/Workspaces';
import WorkspaceDetail from './pages/WorkspaceDetail';

// Components
import Sidebar from './components/Sidebar';
import ChatWidget from './components/ChatWidget';
import AnimatedBackground from './components/AnimatedBackground';
import ReminderService from './services/ReminderService';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Info } from 'lucide-react';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20%' }}>Loading...</div>;

  return user ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, token } = useContext(AuthContext);
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [activeNotification, setActiveNotification] = React.useState(null);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reminder Service Initialization
  React.useEffect(() => {
    if (user && token) {
      ReminderService.start(token, (reminder) => {
        // Play notification sound
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.5;
          audio.play();
        } catch (e) {
          console.log('Audio Blocked');
        }
        
        setActiveNotification(reminder);
        // Auto-dismiss after 8 seconds
        setTimeout(() => setActiveNotification(null), 8000);
      });
    } else {
      ReminderService.stop();
    }
    return () => ReminderService.stop();
  }, [user, token]);

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    if (isMobile) setMobileSidebarOpen(false);
  }, [location, isMobile]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <AnimatedBackground />

      {/* Global Notification Banner */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ y: -100, opacity: 0, x: '-50%' }}
            animate={{ y: 20, opacity: 1, x: '-50%' }}
            exit={{ y: -100, opacity: 0, x: '-50%' }}
            style={{
              position: 'fixed', top: 0, left: '50%', zIndex: 1000,
              width: '90%', maxWidth: '500px', padding: '1.2rem',
              background: 'rgba(168, 85, 247, 0.95)', backdropFilter: 'blur(16px)',
              borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 30px rgba(168, 85, 247, 0.5)',
              display: 'flex', alignItems: 'center', gap: '1rem', color: 'white'
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
              <Bell size={24} className="bell-ring" />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>ALARM: {activeNotification.title}</h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem', opacity: 0.9 }}>{activeNotification.message || 'Time to complete your task!'}</p>
            </div>
            <button 
              onClick={() => setActiveNotification(null)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.6 }}
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
        <Route path="/workspaces" element={
          <PrivateRoute>
            <Workspaces />
          </PrivateRoute>
        } />
        <Route path="/workspaces/:id" element={
          <PrivateRoute>
            <WorkspaceDetail />
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
        <SocketProvider>
          <ThemeProvider>
            <AppRoutes />
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
