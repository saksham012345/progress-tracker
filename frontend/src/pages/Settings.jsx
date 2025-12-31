import React from 'react';
import { motion } from 'framer-motion';

const Settings = () => {
    return (
        <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Settings</h2>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', maxWidth: '600px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'linear-gradient(45deg, var(--accent), #8b5cf6)'
                    }} />
                    <div>
                        <h3 style={{ fontSize: '1.5rem' }}>Student User</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>student@university.edu</p>
                    </div>
                    <button style={{
                        marginLeft: 'auto',
                        padding: '0.5rem 1rem',
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        borderRadius: '6px'
                    }}>Edit Profile</button>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Preferences</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span>Dark Mode</span>
                        <div style={{ width: '40px', height: '20px', background: 'var(--accent)', borderRadius: '10px', position: 'relative' }}>
                            <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Email Notifications</span>
                        <div style={{ width: '40px', height: '20px', background: 'var(--accent)', borderRadius: '10px', position: 'relative' }}>
                            <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px' }} />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Settings;
