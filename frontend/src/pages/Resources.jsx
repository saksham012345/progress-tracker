import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Book, FileText, ExternalLink, Filter } from 'lucide-react';
import { API_URL } from '../config';

const Resources = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/ai/resources');
            if (res.ok) {
                const data = await res.json();
                setResources(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', margin: 0 }}>Learning Resources</h2>
                <button
                    onClick={fetchResources}
                    style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {loading ? (
                <p>Loading knowledge base...</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {resources.map((res, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -5 }}
                            style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>
                                <Book size={20} />
                                <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{res.category}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{res.content}</p>
                        </motion.div>
                    ))}
                    {resources.length === 0 && (
                        <p style={{ color: 'var(--text-secondary)' }}>No resources found in the Knowledge Base.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Resources;
