import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, BookOpen, Target, Sparkles } from 'lucide-react';
import TopicCard from '../components/TopicCard';
import { API_URL } from '../config';

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
            const res = await fetch(`${API_URL}/api/topics`);
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
            const res = await fetch(`${API_URL}/api/topics`, {
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100
            }
        }
    };

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '3rem' }}
            >
                <div>
                    <h2 style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Dashboard
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Your personal knowledge command center.</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 0 20px var(--accent-glow)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="glass-card"
                    style={{
                        background: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        padding: '1rem 2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontWeight: 600,
                        fontSize: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    {showAddForm ? <X size={22} /> : <Plus size={22} />}
                    {showAddForm ? 'Close' : 'New Topic'}
                </motion.button>
            </motion.div>

            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginBottom: '2rem' }}
                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <form
                            onSubmit={handleSubmit}
                            className="glass-panel"
                            style={{
                                padding: '2rem',
                                borderRadius: '24px',
                                display: 'grid',
                                gap: '1.5rem'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                                <Sparkles size={20} />
                                <h3 style={{ fontSize: '1.2rem' }}>Create New Learning Module</h3>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <BookOpen size={18} style={{ position: 'absolute', top: '1.1rem', left: '1rem', color: 'var(--text-secondary)' }} />
                                    <input
                                        placeholder="Topic Title (e.g. Advanced Neural Networks)"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            background: 'rgba(0,0,0,0.2)',
                                            border: '1px solid var(--border)',
                                            padding: '1rem 1rem 1rem 3rem',
                                            borderRadius: '12px',
                                            color: 'var(--text-primary)',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Target size={18} style={{ position: 'absolute', top: '1.1rem', left: '1rem', color: 'var(--text-secondary)' }} />
                                    <input
                                        placeholder="Category (e.g. AI/ML)"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            background: 'rgba(0,0,0,0.2)',
                                            border: '1px solid var(--border)',
                                            padding: '1rem 1rem 1rem 3rem',
                                            borderRadius: '12px',
                                            color: 'var(--text-primary)',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            </div>
                            <input
                                placeholder="Learning Goal (e.g. Master transformers in 2 weeks)"
                                value={formData.goal}
                                onChange={e => setFormData({ ...formData, goal: e.target.value })}
                                style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--border)',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem',
                                    marginBottom: '0.5rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    type="submit"
                                    style={{
                                        background: 'var(--success)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '1rem 3rem',
                                        borderRadius: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                                    }}
                                >
                                    Initialize Module
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Loader2 size={50} color="var(--accent)" />
                    </motion.div>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '2rem'
                    }}
                >
                    {topics.map(topic => (
                        <motion.div key={topic._id} variants={itemVariants}>
                            <TopicCard topic={topic} />
                        </motion.div>
                    ))}
                    {topics.length === 0 && (
                        <motion.div
                            variants={itemVariants}
                            className="glass-panel"
                            style={{
                                gridColumn: '1/-1',
                                textAlign: 'center',
                                color: 'var(--text-secondary)',
                                padding: '6rem',
                                borderRadius: '24px',
                                background: 'rgba(255,255,255,0.02)'
                            }}
                        >
                            <Sparkles size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>System Empty</h3>
                            <p>Initialize your first learning module to begin tracking.</p>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default Dashboard;
