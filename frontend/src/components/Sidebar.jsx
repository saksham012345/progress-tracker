import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart2, Book, Settings, BookOpen, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const Sidebar = () => {
    const navItems = [
        { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
        { path: '/planner', icon: <Target size={20} />, label: 'AI Planner' },
        { path: '/resources', icon: <Book size={20} />, label: 'Resources' },
        { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
    ];

    return (
        <div style={{
            width: '250px',
            background: 'var(--card-bg)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
            position: 'fixed',
            height: '100vh',
            top: 0,
            left: 0
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', paddingLeft: '0.5rem' }}>
                <BookOpen size={28} color="var(--accent)" />
                <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700 }}>NeuroTrack</h1>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: isActive ? 'white' : 'var(--text-secondary)',
                            background: isActive ? 'var(--accent)' : 'transparent',
                            transition: 'all 0.2s ease',
                            fontWeight: isActive ? 600 : 400
                        })}
                    >
                        {item.icon}
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', padding: '1rem 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'linear-gradient(45deg, var(--accent), #8b5cf6)'
                    }} />
                    <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Student User</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pro Plan</p>
                    </div>
                </div>
                <ThemeToggle />
            </div>
        </div>
    );
};

export default Sidebar;
