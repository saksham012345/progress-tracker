import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart2, Book, Settings, BookOpen, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { ThemeContext } from '../context/ThemeContext'; // Ensure context is used if needed for logos

const Sidebar = () => {
    const navItems = [
        { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
        { path: '/planner', icon: <Target size={20} />, label: 'AI Planner' },
        { path: '/resources', icon: <Book size={20} />, label: 'Resources' },
        { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
    ];

    return (
        <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-panel"
            style={{
                width: '260px',
                position: 'fixed',
                height: '95vh',
                top: '2.5vh',
                left: '20px',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem',
                zIndex: 50,
                borderRight: 'none', // Overriding glass-panel border if needed
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem', paddingLeft: '0.5rem' }}>
                <div style={{
                    background: 'var(--accent)',
                    padding: '8px',
                    borderRadius: '12px',
                    boxShadow: '0 0 15px var(--accent-glow)'
                }}>
                    <BookOpen size={24} color="white" />
                </div>
                <h1 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 700, letterSpacing: '-0.03em' }}>NeuroTarget</h1>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
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
                        S
                    </div>
                    <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Student User</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Pro Plan</p>
                    </div>
                </div>
                <ThemeToggle />
            </div>
        </motion.div>
    );
};

export default Sidebar;
