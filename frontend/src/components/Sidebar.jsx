import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart2, Book, Settings, BookOpen, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ isMobile, isOpen, onClose }) => {
    const { user } = useContext(AuthContext);
    const navItems = [
        { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/workspaces', icon: <Target size={20} />, label: 'Workspaces' },
        { path: '/analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
        { path: '/planner', icon: <Target size={20} />, label: 'AI Planner' },
        { path: '/resources', icon: <Book size={20} />, label: 'Resources' },
        { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
    ];

    // Animation variants
    const sidebarVariants = {
        desktop: { x: 0, opacity: 1 },
        mobileClosed: { x: '-100%', opacity: 0 },
        mobileOpen: { x: 0, opacity: 1 },
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40,
                        backdropFilter: 'blur(4px)'
                    }}
                />
            )}

            <motion.div
                initial={isMobile ? "mobileClosed" : "desktop"}
                animate={isMobile ? (isOpen ? "mobileOpen" : "mobileClosed") : "desktop"}
                variants={sidebarVariants}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="glass-panel"
                style={{
                    width: '260px',
                    position: 'fixed',
                    height: '95vh',
                    top: '2.5vh',
                    left: isMobile ? '0' : '20px', // Full left on mobile
                    borderTopLeftRadius: isMobile ? 0 : '24px',
                    borderBottomLeftRadius: isMobile ? 0 : '24px',
                    borderRadius: isMobile ? '0 24px 24px 0' : '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.5rem',
                    zIndex: 50,
                    borderRight: 'none',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem', paddingLeft: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            background: 'var(--accent)',
                            padding: '8px',
                            borderRadius: '12px',
                            boxShadow: '0 0 15px var(--accent-glow)'
                        }}>
                            <BookOpen size={24} color="white" />
                        </div>
                        <h1 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 700, letterSpacing: '-0.03em' }}>HyperActive</h1>
                    </div>
                    {/* Close Button on Mobile */}
                    {isMobile && (
                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={isMobile ? onClose : undefined} // Close on click (mobile)
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem 1.2rem',
                                borderRadius: '16px',
                                textDecoration: 'none',
                                color: isActive ? 'white' : 'var(--text-secondary)',
                                background: isActive ? 'var(--accent)' : 'transparent',
                                boxShadow: isActive ? '0 4px 20px var(--accent-glow)' : 'none',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                fontWeight: isActive ? 600 : 500,
                                position: 'relative',
                                overflow: 'hidden'
                            })}
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    {/* Gamification Stats */}
                    <div className="glass-card" style={{
                        padding: '1rem',
                        marginBottom: '1rem',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Level {user?.level || 1}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user?.points || 0} XP</span>
                        </div>
                        <div style={{
                            height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden'
                        }}>
                             <div style={{
                                width: `${(user?.points || 0) % 200 / 2 * 100}%`, // Simplified level progress
                                height: '100%',
                                background: 'linear-gradient(90deg, var(--accent), #a855f7)',
                                transition: 'width 1s ease-out'
                             }} />
                        </div>
                    </div>

                    <div className="glass-card" style={{
                        padding: '1rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        borderRadius: '16px',
                        background: 'rgba(255,255,255,0.05)'
                    }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, var(--accent), #a855f7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 'bold'
                        }}>
                            {user?.username?.[0] || 'U'}
                        </div>
                        <div>
                            <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{user?.username || 'User'}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{user?.streak || 0} Day Streak 🔥</p>
                        </div>
                    </div>
                    <ThemeToggle />
                </div>
            </motion.div>
        </>
    );
};

export default Sidebar;
