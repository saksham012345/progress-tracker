import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2 } from 'lucide-react';
import TopicCard from '../components/TopicCard';

const Dashboard = () => {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({ title: '', category: '', goal: '' });

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/topics');
            const data = await res.json();
            setTopics(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setFormData({ title: '', category: '', goal: '' });
                setShowAddForm(false);
                fetchTopics();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Dashboard</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Track your learning journey.</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        background: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 600
                    }}
                >
                    {showAddForm ? <X size={20} /> : <Plus size={20} />}
                    {showAddForm ? 'Close' : 'Add Topic'}
                </motion.button>
            </div>

            <AnimatePresence>
                {showAddForm && (
                    <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleSubmit}
                        style={{
                            background: 'var(--card-bg)',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            marginBottom: '2rem',
                            border: '1px solid var(--border)',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <input
                                placeholder="Topic Title (e.g. React Hooks)"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                                style={{
                                    background: 'var(--bg-color)',
                                    border: '1px solid var(--border)',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
                            />
                            <input
                                placeholder="Category (e.g. Frontend)"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                required
                                style={{
                                    background: 'var(--bg-color)',
                                    border: '1px solid var(--border)',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
                            />
                        </div>
                        <input
                            placeholder="Goal (Optional)"
                            value={formData.goal}
                            onChange={e => setFormData({ ...formData, goal: e.target.value })}
                            style={{
                                width: '100%',
                                background: 'var(--bg-color)',
                                border: '1px solid var(--border)',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                color: 'white',
                                marginBottom: '1rem'
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                background: 'var(--success)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '6px',
                                fontWeight: 600
                            }}
                        >
                            Create Topic
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                        <Loader2 size={40} color="var(--accent)" />
                    </motion.div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {topics.map(topic => (
                        <TopicCard key={topic._id} topic={topic} />
                    ))}
                    {topics.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem' }}>
                            <p>No topics yet. Add one to get started!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
