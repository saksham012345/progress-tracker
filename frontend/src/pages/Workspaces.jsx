import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import { Plus, Users, MessageSquare, ArrowRight, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Workspaces = () => {
    const { token, user } = useContext(AuthContext);
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const fetchWorkspaces = async () => {
        try {
            const res = await fetch(`${API_URL}/api/workspaces`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWorkspaces(data);
            }
        } catch (err) {
            console.error('Fetch Workspaces Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/workspaces`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newWorkspace)
            });
            if (res.ok) {
                const data = await res.json();
                setWorkspaces([data, ...workspaces]);
                setShowCreateModal(false);
                setNewWorkspace({ name: '', description: '' });
            }
        } catch (err) {
            console.error('Create Workspace Error:', err);
        }
    };

    return (
        <div style={{ color: 'var(--text-primary)' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.04em' }}>Workspaces</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Collaborate with your team in real-time.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="accent-button"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 600
                    }}
                >
                    <Plus size={20} /> Create Workspace
                </button>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Workspaces...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {workspaces.map((ws) => (
                        <motion.div
                            key={ws._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card"
                            style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: 'var(--accent-glow)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', color: 'var(--accent)'
                                }}>
                                    <Users size={24} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{
                                        fontSize: '0.7rem', padding: '4px 8px', borderRadius: '20px',
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {ws.members?.length || 0} Members
                                    </span>
                                </div>
                            </div>

                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{ws.name}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', minHeight: '3em' }}>
                                {ws.description || 'No description provided.'}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <Shield size={14} />
                                    <span>Owned by {ws.owner?.username || 'You'}</span>
                                </div>
                                <Link to={`/workspaces/${ws._id}`}>
                                    <button style={{
                                        background: 'transparent', border: 'none', color: 'var(--accent)',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600,
                                        cursor: 'pointer'
                                    }}>
                                        Enter <ArrowRight size={16} />
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card"
                            style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}
                        >
                            <h2 style={{ marginBottom: '1.5rem' }}>Create New Workspace</h2>
                            <form onSubmit={handleCreate}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newWorkspace.name}
                                        onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                                        style={{
                                            width: '100%', padding: '0.8rem', borderRadius: '8px',
                                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'white'
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description</label>
                                    <textarea
                                        value={newWorkspace.description}
                                        onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                                        style={{
                                            width: '100%', padding: '0.8rem', borderRadius: '8px',
                                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'white', minHeight: '100px'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        style={{
                                            flex: 1, padding: '0.8rem', borderRadius: '8px',
                                            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'white', cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="accent-button"
                                        style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', fontWeight: 600 }}
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Workspaces;
