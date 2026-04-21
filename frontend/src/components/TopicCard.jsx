import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Target, Sparkles, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';

const TopicCard = ({ topic, onUpdate }) => {
    const [decomposing, setDecomposing] = React.useState(false);
    const [showSubTasks, setShowSubTasks] = React.useState(false);

    const statusColor = {
        'Not Started': 'var(--text-secondary)',
        'In Progress': 'var(--accent)',
        'Revised': 'var(--success)'
    };

    const handleDecompose = async () => {
        setDecomposing(true);
        try {
            const res = await fetch(`${API_URL}/api/ai/decompose`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task: topic.title, context: topic.goal })
            });
            if (res.ok) {
                const data = await res.json();
                // Send update to parent to save subtasks
                if (onUpdate) {
                    onUpdate(topic._id, { subTasks: data.subTasks.map(t => ({ title: t, completed: false })) });
                }
                setShowSubTasks(true);
            }
        } catch (err) {
            console.error('Decomposition Error:', err);
        } finally {
            setDecomposing(false);
        }
    };

    const toggleSubTask = async (index) => {
        const newSubTasks = [...(topic.subTasks || [])];
        newSubTasks[index].completed = !newSubTasks[index].completed;
        if (onUpdate) {
            onUpdate(topic._id, { subTasks: newSubTasks });
        }
    };

    return (
        <motion.div
            whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
            className="glass-card gloss-effect"
            style={{
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)'
            }}
        >
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                background: statusColor[topic.status] || 'var(--text-secondary)'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{topic.category}</span>
                    <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem', fontWeight: 700 }}>{topic.title}</h3>
                </div>
                <button
                    onClick={handleDecompose}
                    disabled={decomposing}
                    style={{
                        background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7',
                        border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '8px',
                        padding: '6px', cursor: 'pointer', display: 'flex', gap: '0.4rem'
                    }}
                >
                    {decomposing ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                </button>
            </div>

            {topic.goal && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Target size={16} />
                    <span>{topic.goal}</span>
                </div>
            )}

            {/* Sub Tasks Section */}
            {topic.subTasks?.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                    <div
                        onClick={() => setShowSubTasks(!showSubTasks)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, color: 'var(--accent)' }}
                    >
                        {showSubTasks ? 'Hide Sub-tasks' : `View ${topic.subTasks.length} Sub-tasks`}
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                    </div>
                    {showSubTasks && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} style={{ overflow: 'hidden', marginTop: '0.8rem' }}>
                            {topic.subTasks.map((st, i) => (
                                <div
                                    key={i}
                                    onClick={() => toggleSubTask(i)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.8rem',
                                        fontSize: '0.85rem', padding: '6px 0', cursor: 'pointer',
                                        color: st.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                                        textDecoration: st.completed ? 'line-through' : 'none'
                                    }}
                                >
                                    {st.completed ? <CheckCircle size={14} color="var(--success)" /> : <Circle size={14} />}
                                    {st.title}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem' }}>
                <span style={{
                    padding: '0.25rem 0.75rem', borderRadius: '20px',
                    background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem',
                    color: statusColor[topic.status]
                }}>
                    {topic.status}
                </span>

                <Link to={`/topic/${topic._id}`}>
                    <button style={{
                        background: 'none', border: 'none', color: 'var(--text-primary)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600
                    }}>
                        Explore <ArrowRight size={16} />
                    </button>
                </Link>
            </div>
        </motion.div>
    );
};

export default TopicCard;
