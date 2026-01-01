import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Book, FileText, ExternalLink, Filter, RefreshCw } from 'lucide-react';
import { API_URL } from '../config';

const Resources = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newItem, setNewItem] = useState({ category: '', content: '' });

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
                fetchResources(); // Refresh list
            }
        } catch (err) {
            console.error("Failed to add:", err);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', margin: 0 }}>Learning Resources</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                    >
                        {showForm ? 'Cancel' : '+ Add Resource'}
                    </button>
                    <button
                        onClick={fetchResources}
                        style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {showForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ marginBottom: '2rem', overflow: 'hidden' }}
                >
                    <form onSubmit={handleAdd} style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'grid', gap: '1rem' }}>
                        <input
                            placeholder="Category (e.g. Notes, Formula)"
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                            required
                        />
                        <textarea
                            placeholder="Paste your content or notes here..."
                            value={newItem.content}
                            onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                            style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-primary)', minHeight: '100px' }}
                            required
                        />
                        <button type="submit" style={{ padding: '0.8rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Save to Knowledge Base
                        </button>
                    </form>
                </motion.div>
            )}

            {loading ? (
                <p>Loading knowledge base...</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
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
                                <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                                    {res.title || res.category}
                                </span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                                {res.content}
                            </div>
                        </motion.div>
                    ))}
                    {resources.length === 0 && (
                        <p style={{ color: 'var(--text-secondary)' }}>No resources found. Add some to get started!</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Resources;
