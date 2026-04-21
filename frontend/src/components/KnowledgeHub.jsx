import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as Bin, ExternalLink, Trash2, Plus, Code, FileText, Globe, PlusCircle } from 'lucide-react';
import { API_URL } from '../config';

const KnowledgeHub = ({ workspaceId, token }) => {
    const [resources, setResources] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newData, setNewData] = useState({ title: '', url: '', type: 'Link' });

    useEffect(() => {
        fetchResources();
    }, [workspaceId]);

    const fetchResources = async () => {
        try {
            const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/resources`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setResources(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/resources`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ workspaceId, ...newData })
            });
            if (res.ok) {
                setNewData({ title: '', url: '', type: 'Link' });
                setShowAdd(false);
                fetchResources();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteResource = async (id) => {
        try {
            await fetch(`${API_URL}/api/resources/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchResources();
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Snippet': return <Code size={20} />;
            case 'PDF': return <FileText size={20} />;
            default: return <Globe size={20} />;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Knowledge Hub</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Shared study materials and useful links.</p>
                </div>
                <button 
                    onClick={() => setShowAdd(!showAdd)}
                    className="accent-button"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1.5rem', borderRadius: '12px' }}
                >
                    <PlusCircle size={20} /> Add Resource
                </button>
            </header>

            <AnimatePresence>
                {showAdd && (
                    <motion.form 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleAdd}
                        className="glass-panel"
                        style={{ padding: '1.5rem', borderRadius: '20px', display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: '1rem', overflow: 'hidden' }}
                    >
                        <input placeholder="Title" required value={newData.title} onChange={e => setNewData({...newData, title: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.8rem', borderRadius: '10px', color: 'white' }} />
                        <input placeholder="URL / Content" required value={newData.url} onChange={e => setNewData({...newData, url: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.8rem', borderRadius: '10px', color: 'white' }} />
                        <select value={newData.type} onChange={e => setNewData({...newData, type: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.8rem', borderRadius: '10px', color: 'white' }}>
                            <option value="Link">Link</option>
                            <option value="Snippet">Snippet</option>
                            <option value="PDF">PDF Reference</option>
                        </select>
                        <button type="submit" className="success-button" style={{ height: '100%', borderRadius: '10px' }}>Add</button>
                    </motion.form>
                )}
            </AnimatePresence>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {resources.map(r => (
                    <motion.div 
                        key={r._id} 
                        className="glass-panel" 
                        style={{ padding: '1.2rem', borderRadius: '20px', display: 'flex', gap: '1rem', alignItems: 'center' }}
                        whileHover={{ y: -5 }}
                    >
                        <div style={{ background: 'var(--accent-glow)', padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>
                            {getIcon(r.type)}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <h4 style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.url}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <a href={r.url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)' }}>
                                <ExternalLink size={18} />
                            </a>
                            <button onClick={() => deleteResource(r._id)} style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.5)', cursor: 'pointer' }}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </motion.div>
                ))}
                {resources.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', opacity: 0.3 }}>
                        No shared resources yet. Be the first to contribute!
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeHub;
