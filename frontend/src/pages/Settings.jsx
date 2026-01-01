import React, { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Moon, Sun, Bell, User, Shield, ChevronRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const Settings = () => {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [notifications, setNotifications] = useState(true);

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Settings</h2>

            {/* Profile Section */}
            <motion.div variants={itemVariants} style={{
                background: 'var(--card-bg)',
                padding: '2rem',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap'
            }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', fontWeight: 'bold', color: 'white'
                }}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{user?.username || 'Guest User'}</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: '0.2rem 0' }}>{user?.email || 'No email linked'}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                            Free Plan
                        </span>
                        <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e' }}>
                            Active
                        </span>
                    </div>
                </div>
                <button
                    onClick={logout}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                >
                    <LogOut size={18} />
                    Log Out
                </button>
            </motion.div>

            {/* Settings Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Appearance */}
                <motion.div variants={itemVariants} style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                        <Moon size={24} />
                        <h3 style={{ margin: 0 }}>Appearance</h3>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px' }}>
                        <div>
                            <p style={{ margin: 0, fontWeight: 600 }}>Theme Mode</p>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                        </div>
                        <button
                            onClick={toggleTheme}
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border)',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: 'var(--accent)'
                            }}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </motion.div>

                {/* Notifications */}
                <motion.div variants={itemVariants} style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                        <Bell size={24} />
                        <h3 style={{ margin: 0 }}>Notifications</h3>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px' }}>
                        <div>
                            <p style={{ margin: 0, fontWeight: 600 }}>Email Alerts</p>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Weekly progress reports</span>
                        </div>
                        <div
                            onClick={() => setNotifications(!notifications)}
                            style={{
                                width: '48px', height: '26px',
                                background: notifications ? 'var(--accent)' : 'var(--border)',
                                borderRadius: '13px',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'background 0.3s'
                            }}
                        >
                            <div style={{
                                width: '20px', height: '20px',
                                background: 'white',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '3px',
                                left: notifications ? '25px' : '3px',
                                transition: 'left 0.3s'
                            }} />
                        </div>
                    </div>
                </motion.div>

                {/* Account */}
                <motion.div variants={itemVariants} style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                        <Shield size={24} />
                        <h3 style={{ margin: 0 }}>Security</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <button style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-color)', border: 'none', borderRadius: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                            <span>Change Password</span>
                            <ChevronRight size={18} color="var(--text-secondary)" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Settings;
