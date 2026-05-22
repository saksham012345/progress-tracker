import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, BookOpen, Target, Sparkles, Bell, Trash2, Calendar, Flame, RefreshCw, Edit2 } from 'lucide-react';
import TopicCard from '../components/TopicCard';
import GamificationHeader from '../components/GamificationHeader';
import { API_URL } from '../config';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
    const [topics, setTopics] = useState([]);
    const [dueReviews, setDueReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const [formData, setFormData] = useState({ title: '', category: '', goal: '', deadline: '', difficulty: 'Medium' });
    const [reminders, setReminders] = useState([]);
    const [showReminderForm, setShowReminderForm] = useState(false);
    const [reminderData, setReminderData] = useState({ title: '', message: '', time: '' });
    const { token, user, refreshUser } = useContext(AuthContext);

    useEffect(() => {
        fetchTopics();
        fetchReminders();
        fetchDueReviews();
    }, []);

    const fetchDueReviews = async () => {
        try {
            const res = await fetch(`${API_URL}/api/topics/due-review`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setDueReviews(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchReminders = async () => {
        try {
            const res = await fetch(`${API_URL}/api/reminders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setReminders(data);
        } catch (err) { console.error('Fetch Reminders Error:', err); }
    };

    const fetchTopics = async () => {
        try {
            // Fixed: include auth header so only user's own topics are returned
            const res = await fetch(`${API_URL}/api/topics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setTopics(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const updateTopic = async (id, updates) => {
        try {
            const res = await fetch(`${API_URL}/api/topics/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                fetchTopics();
                if (updates.status === 'Revised') { refreshUser(); fetchDueReviews(); }
            }
        } catch (err) { console.error(err); }
    };

    const handleAddReminder = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/reminders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: reminderData.title, message: reminderData.message, reminderTime: reminderData.time })
            });
            if (res.ok) { setReminderData({ title: '', message: '', time: '' }); setShowReminderForm(false); fetchReminders(); }
        } catch (err) { console.error(err); }
    };

    const deleteReminder = async (id) => {
        try {
            await fetch(`${API_URL}/api/reminders/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            fetchReminders();
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTopic) {
                // Edit existing topic
                const res = await fetch(`${API_URL}/api/topics/${editingTopic._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(formData)
                });
                if (res.ok) { setEditingTopic(null); setShowAddForm(false); setFormData({ title: '', category: '', goal: '', deadline: '', difficulty: 'Medium' }); fetchTopics(); }
            } else {
                const res = await fetch(`${API_URL}/api/topics`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(formData)
                });
                if (res.ok) { setFormData({ title: '', category: '', goal: '', deadline: '', difficulty: 'Medium' }); setShowAddForm(false); fetchTopics(); }
            }
        } catch (err) { console.error(err); }
    };

    const openEdit = (topic) => {
        setEditingTopic(topic);
        setFormData({ title: topic.title, category: topic.category, goal: topic.goal || '', deadline: topic.deadline ? topic.deadline.split('T')[0] : '', difficulty: topic.difficulty || 'Medium' });
        setShowAddForm(true);
    };

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } };

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={{ flex: 1 }}>
                    <GamificationHeader user={user} />

                    {/* Spaced Repetition Due Banner */}
                    <AnimatePresence>
                        {dueReviews.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{
                                    marginBottom: '1.5rem', padding: '1rem 1.5rem',
                                    background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
                                    border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px',
                                    display: 'flex', alignItems: 'center', gap: '1rem'
                                }}
                            >
                                <RefreshCw size={20} color="#f59e0b" />
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontWeight: 700, color: '#f59e0b' }}>
                                        {dueReviews.length} topic{dueReviews.length > 1 ? 's' : ''} due for review
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                        {dueReviews.map(t => t.title).join(', ')}
                                    </p>
                                </div>
                                <span
                                    onClick={() => {
                                        document.querySelector('[data-due-review]')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Review Now →
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '2rem' }}
                    >
                        <div>
                            <h2 style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Dashboard
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Welcome back, {user?.username}.</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 0 20px var(--accent-glow)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setEditingTopic(null); setFormData({ title: '', category: '', goal: '', deadline: '', difficulty: 'Medium' }); setShowAddForm(!showAddForm); }}
                            className="glass-card"
                            style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
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
                                <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', display: 'grid', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                                        {editingTopic ? <Edit2 size={20} /> : <Sparkles size={20} />}
                                        <h3 style={{ fontSize: '1.2rem' }}>{editingTopic ? 'Edit Topic' : 'Create New Learning Module'}</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div style={{ position: 'relative' }}>
                                            <BookOpen size={18} style={{ position: 'absolute', top: '1.1rem', left: '1rem', color: 'var(--text-secondary)' }} />
                                            <input placeholder="Topic Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <Target size={18} style={{ position: 'absolute', top: '1.1rem', left: '1rem', color: 'var(--text-secondary)' }} />
                                            <input placeholder="Category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Goal</label>
                                            <input placeholder="Learning Goal" value={formData.goal} onChange={e => setFormData({ ...formData, goal: e.target.value })} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', padding: '0.8rem', borderRadius: '12px', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Target Date</label>
                                            <input type="date" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'white', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Difficulty</label>
                                            <select value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'white', boxSizing: 'border-box' }}>
                                                <option value="Easy">Easy</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Hard">Hard</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                        {editingTopic && (
                                            <button type="button" onClick={() => { setEditingTopic(null); setShowAddForm(false); }} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                        )}
                                        <button type="submit" style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '1rem 3rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
                                            {editingTopic ? 'Save Changes' : 'Initialize Module'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                <Loader2 size={50} color="var(--accent)" />
                            </motion.div>
                        </div>
                    ) : (
                        <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {topics.map(topic => (
                                <motion.div key={topic._id} variants={itemVariants}>
                                    <TopicCard topic={topic} onUpdate={updateTopic} onEdit={openEdit} />
                                </motion.div>
                            ))}
                            {topics.length === 0 && (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)', padding: '6rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }}>
                                    <Sparkles size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <h3>System Empty</h3>
                                    <p>Initialize your first learning module to begin tracking.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Sidebar */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--accent)' }}>
                                <Bell size={20} />
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Active Alarms</h3>
                            </div>
                            <button onClick={() => setShowReminderForm(!showReminderForm)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '4px' }}>
                                {showReminderForm ? <X size={18} /> : <Plus size={18} />}
                            </button>
                        </div>
                        <AnimatePresence>
                            {showReminderForm && (
                                <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleAddReminder} style={{ overflow: 'hidden', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <input placeholder="Alarm Title" value={reminderData.title} onChange={e => setReminderData({ ...reminderData, title: e.target.value })} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.6rem', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }} />
                                    <input placeholder="Message (optional)" value={reminderData.message} onChange={e => setReminderData({ ...reminderData, message: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.6rem', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }} />
                                    <input type="datetime-local" value={reminderData.time} onChange={e => setReminderData({ ...reminderData, time: e.target.value })} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.6rem', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }} />
                                    <button type="submit" style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Set Alarm</button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {reminders.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '1rem' }}>
                                    <Calendar size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>No active alarms.</p>
                                </div>
                            ) : (
                                reminders.map(r => (
                                    <motion.div layout key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{r.title}</p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {new Date(r.reminderTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <button onClick={() => deleteReminder(r._id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.5 }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.05))', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                            <Flame size={20} color="#ff9d00" />
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Streak Tip</h3>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                            You're on a {user?.streak || 0}-day streak! Consistency is the secret to mastery. Log in tomorrow to keep the flame alive.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Dashboard;
