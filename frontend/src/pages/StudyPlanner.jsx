import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle, Loader2, Target, Save, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { API_URL } from '../config';
import { AuthContext } from '../context/AuthContext';

const StudyPlanner = () => {
    const { token } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        topics: '',
        goals: '',
        hours: 10
    });
    const [plan, setPlan] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedPlans, setSavedPlans] = useState([]);
    const [showSaved, setShowSaved] = useState(false);
    const [expandedPlan, setExpandedPlan] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSavedPlans();
    }, []);

    const fetchSavedPlans = async () => {
        try {
            const res = await fetch(`${API_URL}/api/plans`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSavedPlans(data);
            }
        } catch (err) {
            console.error('Fetch Plans Error:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setPlan('');
        setSaveSuccess(false);
        setError('');

        try {
            const res = await fetch(`${API_URL}/api/ai/plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topics: formData.topics.split(',').map(t => t.trim()),
                    goals: formData.goals,
                    hours: formData.hours
                })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                const errorMessage = data.message || 
                    (res.status === 503 ? 'AI Service is starting up. Please try again in 30-60 seconds.' : 
                     'Failed to generate plan. Please try again.');
                setError(errorMessage);
                return;
            }
            
            if (data.plan) {
                setPlan(data.plan);
            } else {
                setError('Generated plan was empty. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setError('Network error: Unable to reach the server. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePlan = async () => {
        if (!plan) return;
        setSaving(true);
        try {
            const topicsList = formData.topics.split(',').map(t => t.trim());
            const title = `Plan: ${topicsList.join(', ')} — ${new Date().toLocaleDateString()}`;
            
            const res = await fetch(`${API_URL}/api/plans`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    content: plan,
                    topics: topicsList,
                    goals: formData.goals,
                    hoursPerWeek: parseInt(formData.hours)
                })
            });
            if (res.ok) {
                setSaveSuccess(true);
                fetchSavedPlans();
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Save Plan Error:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePlan = async (id) => {
        try {
            await fetch(`${API_URL}/api/plans/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchSavedPlans();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>AI Study Planner</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Form Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}
                >
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Topics (comma separated)</label>
                            <input
                                type="text"
                                placeholder="e.g. React, Algorithms, SQL"
                                value={formData.topics}
                                onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Learning Goal</label>
                            <input
                                type="text"
                                placeholder="e.g. Prepare for interview next week"
                                value={formData.goals}
                                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Weekly Hours: {formData.hours}</label>
                            <input
                                type="range"
                                min="1" max="40"
                                value={formData.hours}
                                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '1rem',
                                background: 'var(--accent)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Generating Plan...' : 'Generate Schedule'}
                        </button>
                    </form>
                </motion.div>

                {/* Result Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                        background: 'var(--card-bg)',
                        padding: '2rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        minHeight: '400px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Calendar size={24} color="var(--accent)" />
                        <h3 style={{ fontSize: '1.25rem', margin: 0, flex: 1 }}>Your Weekly Schedule</h3>
                        {plan && (
                            <motion.button
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSavePlan}
                                disabled={saving || saveSuccess}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.6rem 1.2rem', borderRadius: '10px',
                                    background: saveSuccess ? 'var(--success)' : 'var(--accent)',
                                    color: 'white', border: 'none', fontWeight: 600,
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.7 : 1,
                                    transition: 'background 0.3s'
                                }}
                            >
                                {saveSuccess ? (
                                    <><CheckCircle size={16} /> Saved!</>
                                ) : saving ? (
                                    <><Loader2 size={16} className="spin" /> Saving...</>
                                ) : (
                                    <><Save size={16} /> Save Plan</>
                                )}
                            </motion.button>
                        )}
                    </div>

                    <div style={{ flex: 1 }}>
                        {error ? (
                            <div style={{ 
                                padding: '1.5rem',
                                background: 'rgba(255, 0, 0, 0.1)',
                                border: '1px solid rgba(255, 0, 0, 0.3)',
                                borderRadius: '8px',
                                color: '#ff6b6b',
                                fontSize: '0.95rem',
                                lineHeight: '1.6'
                            }}>
                                <strong>⚠️ Error:</strong><br/>
                                {error}
                            </div>
                        ) : plan ? (
                            <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                                {plan}
                            </div>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', opacity: 0.5 }}>
                                <Target size={48} style={{ marginBottom: '1rem' }} />
                                <p>Enter your goals to generate a plan.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Saved Plans Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ marginTop: '2rem' }}
            >
                <button
                    onClick={() => setShowSaved(!showSaved)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                        background: 'var(--card-bg)', border: '1px solid var(--border)',
                        padding: '1.2rem 1.5rem', borderRadius: '12px', color: 'var(--text-primary)',
                        cursor: 'pointer', fontWeight: 600, fontSize: '1.05rem',
                        justifyContent: 'space-between'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={20} color="var(--accent)" />
                        <span>Saved Plans ({savedPlans.length})</span>
                    </div>
                    {showSaved ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                <AnimatePresence>
                    {showSaved && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                                {savedPlans.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
                                        <FileText size={40} style={{ marginBottom: '0.5rem' }} />
                                        <p>No saved plans yet. Generate and save your first plan!</p>
                                    </div>
                                ) : (
                                    savedPlans.map(p => (
                                        <motion.div
                                            key={p._id}
                                            layout
                                            className="glass-card"
                                            style={{
                                                padding: '1.5rem', borderRadius: '16px',
                                                border: expandedPlan === p._id ? '1px solid var(--accent)' : '1px solid var(--border)',
                                                transition: 'border 0.2s'
                                            }}
                                        >
                                            <div
                                                onClick={() => setExpandedPlan(expandedPlan === p._id ? null : p._id)}
                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                            >
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{p.title}</h4>
                                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                                                        {p.hoursPerWeek && <span>{p.hoursPerWeek}h/week</span>}
                                                        {p.topics?.length > 0 && <span>{p.topics.join(', ')}</span>}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeletePlan(p._id); }}
                                                        style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)', cursor: 'pointer', padding: '4px' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    {expandedPlan === p._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </div>
                                            </div>
                                            <AnimatePresence>
                                                {expandedPlan === p._id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        style={{ overflow: 'hidden' }}
                                                    >
                                                        <div style={{
                                                            marginTop: '1rem', paddingTop: '1rem',
                                                            borderTop: '1px solid var(--border)',
                                                            whiteSpace: 'pre-line', lineHeight: '1.8',
                                                            color: 'var(--text-secondary)', fontSize: '0.95rem'
                                                        }}>
                                                            {p.content}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default StudyPlanner;
