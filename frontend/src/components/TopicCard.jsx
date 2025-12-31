import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const TopicCard = ({ topic }) => {
    const statusColor = {
        'Not Started': 'var(--text-secondary)',
        'In Progress': 'var(--accent)',
        'Revised': 'var(--success)'
    };

    return (
        <motion.div
            whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
            style={{
                background: 'var(--card-bg)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                background: statusColor[topic.status] || 'var(--text-secondary)'
            }} />

            <div>
                <span style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'var(--text-secondary)'
                }}>{topic.category}</span>
                <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>{topic.title}</h3>
            </div>

            {topic.goal && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Target size={16} />
                    <span>{topic.goal}</span>
                </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.05)',
                    fontSize: '0.8rem',
                    color: statusColor[topic.status]
                }}>
                    {topic.status}
                </span>

                <Link to={`/topic/${topic._id}`}>
                    <motion.button
                        whileHover={{ x: 5 }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        View <ArrowRight size={16} />
                    </motion.button>
                </Link>
            </div>
        </motion.div>
    );
};

export default TopicCard;
