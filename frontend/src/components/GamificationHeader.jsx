import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Star, Trophy, Flame } from 'lucide-react';

const GamificationHeader = ({ user }) => {
    if (!user) return null;

    const progress = (user.points % 200) / 2; // Level up every 200 points

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                padding: '1.2rem 2.5rem',
                borderRadius: '24px',
                marginBottom: '2rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                justifyContent: 'space-between'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--accent-glow)', padding: '12px', borderRadius: '16px', color: 'var(--accent)' }}>
                    <Zap size={24} />
                </div>
                <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Current Level</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>Lvl {user.level}</span>
                </div>
            </div>

            <div style={{ flex: 1, maxWidth: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Experience Points</span>
                    <span style={{ color: 'white', fontWeight: 600 }}>{user.points % 200} / 200 XP</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-glow))', borderRadius: '4px' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ff9d00' }}>
                        <Flame size={20} />
                        <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{user.streak || 0}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Day Streak</span>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffd700' }}>
                        <Star size={20} />
                        <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{user.points || 0}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total XP</span>
                </div>
            </div>
        </motion.div>
    );
};

export default GamificationHeader;
