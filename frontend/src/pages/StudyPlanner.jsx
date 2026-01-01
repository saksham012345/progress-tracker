import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, BookOpen, CheckCircle, Loader2, Target } from 'lucide-react';
import { API_URL } from '../config';

const StudyPlanner = () => {
    const [formData, setFormData] = useState({
        topics: '',
        goals: '',
        hours: 10
    });
    const [plan, setPlan] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setPlan('');

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
            setPlan(data.plan);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
                        minHeight: '400px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Calendar size={24} color="var(--accent)" />
                        <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Your Weekly Schedule</h3>
                    </div>

                    {plan ? (
                        <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                            {plan}
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', opacity: 0.5 }}>
                            <Target size={48} style={{ marginBottom: '1rem' }} />
                            <p>Enter your goals to generate a plan.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default StudyPlanner;
