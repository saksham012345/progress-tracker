import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Book, FileText, ExternalLink, Filter, RefreshCw, X, Copy, CheckCircle, Plus } from 'lucide-react';
import { API_URL } from '../config';

const Resources = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newItem, setNewItem] = useState({ category: '', content: '' });
    const [selectedResource, setSelectedResource] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const res = await fetch(`${API_URL}/api/ai/resources`);
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

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/ai/resources`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            });
            if (res.ok) {
                setNewItem({ category: '', content: '' });
                setShowForm(false);
                fetchResources();
            }
        } catch (err) {
            console.error("Failed to add:", err);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const CATEGORY_COLORS = {
        'Guide': '#6366f1',
        'Study Material': '#10b981',
        'Notes': '#f59e0b',
        'Formula': '#ec4899',
        'default': '#8b5cf6'
    };

    const getCategoryColor = (cat) => CATEGORY_COLORS[cat] || CATEGORY_COLORS['default'];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, letterSpacing: '-0.03em' }}>Learning Resources</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '0.3rem 0 0' }}>{resources.length} items in your knowledge base</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowForm(!showForm)}
                        style={{
                            background: showForm ? 'rgba(239,68,68,0.15)' : 'var(--accent)',
                            color: showForm ? '#ef4444' : 'white',
                            border: showForm ? '1px solid rgba(239,68,68,0.3)' : 'none',
                            padding: '0.7rem 1.4rem', borderRadius: '12px', cursor: 'pointer',
                            fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add Resource</>}
                    </motion.button>
                    <button
                        onClick={fetchResources}
                        style={{
                            background: 'transparent', border: '1px solid var(--border)',
                            color: 'var(--text-primary)', padding: '0.7rem', borderRadius: '12px', cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ marginBottom: '2rem', overflow: 'hidden' }}
                    >
                        <form onSubmit={handleAdd} className="glass-panel" style={{
                            padding: '1.5rem', borderRadius: '20px',
                            display: 'grid', gap: '1rem'
                        }}>
                            <input
                                placeholder="Category (e.g. Notes, Formula, Guide)"
                                value={newItem.category}
                                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                style={{
                                    padding: '0.9rem 1rem', borderRadius: '12px',
                                    border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)',
                                    color: 'white', fontSize: '0.95rem', outline: 'none'
                                }}
                                required
                            />
                            <textarea
                                placeholder="Paste your content or notes here..."
                                value={newItem.content}
                                onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                                style={{
                                    padding: '0.9rem 1rem', borderRadius: '12px',
                                    border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)',
                                    color: 'white', minHeight: '120px', fontSize: '0.95rem',
                                    outline: 'none', resize: 'vertical', fontFamily: 'inherit'
                                }}
                                required
                            />
                            <button type="submit" style={{
                                padding: '0.9rem', background: 'var(--accent)', color: 'white',
                                border: 'none', borderRadius: '12px', fontWeight: 700,
                                cursor: 'pointer', fontSize: '0.95rem'
                            }}>
                                Save to Knowledge Base
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading knowledge base...</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {resources.map((res, index) => {
                        const category = res.title || res.category || 'Resource';
                        const color = getCategoryColor(res.category);
                        const preview = res.content?.substring(0, 120) + (res.content?.length > 120 ? '...' : '');

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                whileHover={{ y: -6, boxShadow: `0 12px 30px ${color}20` }}
                                onClick={() => setSelectedResource(res)}
                                className="glass-card"
                                style={{
                                    padding: '1.5rem', borderRadius: '20px',
                                    cursor: 'pointer', position: 'relative',
                                    overflow: 'hidden', transition: 'border 0.2s',
                                    borderLeft: `3px solid ${color}`
                                }}
                            >
                                {/* Category accent bar */}
                                <div style={{
                                    position: 'absolute', top: 0, right: 0,
                                    width: '60px', height: '60px',
                                    background: `radial-gradient(circle at top right, ${color}15, transparent)`,
                                    borderRadius: '0 0 0 60px'
                                }} />

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                                    <div style={{
                                        padding: '6px', borderRadius: '8px',
                                        background: `${color}20`, color: color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Book size={18} />
                                    </div>
                                    <span style={{
                                        fontSize: '0.8rem', textTransform: 'uppercase',
                                        letterSpacing: '1px', fontWeight: 700, color: color
                                    }}>
                                        {category}
                                    </span>
                                </div>

                                <div style={{
                                    color: 'var(--text-secondary)', lineHeight: 1.6,
                                    fontSize: '0.9rem', minHeight: '60px'
                                }}>
                                    {preview}
                                </div>

                                <div style={{
                                    marginTop: '1rem', paddingTop: '0.8rem',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
                                        {res.content?.length || 0} chars
                                    </span>
                                    <span style={{
                                        fontSize: '0.75rem', color: color,
                                        fontWeight: 600, opacity: 0.8
                                    }}>
                                        Click to view →
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                    {resources.length === 0 && (
                        <div style={{
                            gridColumn: '1/-1', textAlign: 'center', padding: '5rem',
                            color: 'var(--text-secondary)', opacity: 0.4
                        }}>
                            <Book size={48} style={{ marginBottom: '1rem' }} />
                            <p style={{ fontSize: '1.1rem' }}>No resources found. Add some to get started!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedResource && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedResource(null)}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.75)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 200,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '2rem'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-card"
                            style={{
                                width: '100%', maxWidth: '700px', maxHeight: '80vh',
                                borderRadius: '24px', overflow: 'hidden',
                                display: 'flex', flexDirection: 'column',
                                border: `1px solid ${getCategoryColor(selectedResource.category)}30`
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{
                                padding: '1.5rem 2rem',
                                background: `linear-gradient(135deg, ${getCategoryColor(selectedResource.category)}15, transparent)`,
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{
                                        padding: '10px', borderRadius: '12px',
                                        background: `${getCategoryColor(selectedResource.category)}20`,
                                        color: getCategoryColor(selectedResource.category)
                                    }}>
                                        <Book size={22} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
                                            {selectedResource.title || selectedResource.category || 'Resource'}
                                        </h3>
                                        <span style={{
                                            fontSize: '0.8rem', color: getCategoryColor(selectedResource.category),
                                            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'
                                        }}>
                                            {selectedResource.category || 'General'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleCopy(selectedResource.content)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.5rem 1rem', borderRadius: '10px',
                                            background: copied ? 'var(--success)' : 'rgba(255,255,255,0.08)',
                                            color: 'white', border: 'none', cursor: 'pointer',
                                            fontWeight: 600, fontSize: '0.8rem', transition: 'background 0.3s'
                                        }}
                                    >
                                        {copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                                    </motion.button>
                                    <button
                                        onClick={() => setSelectedResource(null)}
                                        style={{
                                            background: 'rgba(255,255,255,0.08)', border: 'none',
                                            color: 'white', padding: '0.5rem', borderRadius: '10px',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center'
                                        }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div style={{
                                flex: 1, overflowY: 'auto', padding: '2rem',
                                lineHeight: 1.8, color: 'rgba(255,255,255,0.85)',
                                fontSize: '0.95rem', whiteSpace: 'pre-wrap'
                            }}>
                                {selectedResource.content || 'No content available.'}
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                padding: '1rem 2rem',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                fontSize: '0.8rem', color: 'var(--text-secondary)'
                            }}>
                                <span>{selectedResource.content?.length || 0} characters</span>
                                <span>Press Esc or click outside to close</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Resources;
