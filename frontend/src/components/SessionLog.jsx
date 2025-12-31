import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Wand2 } from 'lucide-react';

const SessionLog = ({ sessions, onAddSession, onImproveNotes }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newSession, setNewSession] = useState({ duration: '', notes: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddSession(newSession);
        setNewSession({ duration: '', notes: '' });
        setIsAdding(false);
    };

    return (
        <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.5rem' }}>Study Sessions</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Plus size={16} /> Log Session
                </button>
            </div>

            {isAdding && (
                <motion.form
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
                    style={{
                        background: 'var(--card-bg)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        marginBottom: '1.5rem'
                    }}
                >
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Duration (minutes)</label>
                        <input
                            type="number"
                            value={newSession.duration}
                            onChange={e => setNewSession({ ...newSession, duration: e.target.value })}
                            required
                            style={{
                                width: '100%',
                                background: 'var(--bg-color)',
                                border: '1px solid var(--border)',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Notes</label>
                        <textarea
                            value={newSession.notes}
                            onChange={e => setNewSession({ ...newSession, notes: e.target.value })}
                            required
                            rows={4}
                            style={{
                                width: '100%',
                                background: 'var(--bg-color)',
                                border: '1px solid var(--border)',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                color: 'white',
                                resize: 'vertical'
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            background: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '6px',
                            fontWeight: 600
                        }}
                    >
                        Save Session
                    </button>
                </motion.form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sessions.map((session, index) => (
                    <motion.div
                        key={session._id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={{
                            background: 'var(--card-bg)',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            border: '1px solid var(--border)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                {new Date(session.date).toLocaleDateString()}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                                <Clock size={16} />
                                <span>{session.duration} min</span>
                            </div>
                        </div>
                        <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{session.notes}</p>
                        <button
                            onClick={() => onImproveNotes(session.notes)}
                            style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: 'var(--accent)',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            <Wand2 size={14} /> AI Improve Notes
                        </button>
                    </motion.div>
                ))}
                {sessions.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No sessions logged yet.</p>
                )}
            </div>
        </div>
    );
};

export default SessionLog;
