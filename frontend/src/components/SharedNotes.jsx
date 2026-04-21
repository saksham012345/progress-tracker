import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, Sparkles, Edit3, Eye } from 'lucide-react';
import { API_URL } from '../config';

const SharedNotes = ({ workspaceId, token, socket }) => {
    const [notes, setNotes] = useState([]);
    const [activeNote, setActiveNote] = useState(null);
    const [content, setContent] = useState('');
    const [isEditing, setIsEditing] = useState(true);
    const [saving, setSaving] = useState(false);
    const timeoutRef = useRef();

    useEffect(() => {
        fetchNotes();

        if (socket) {
            socket.on('receiveNoteUpdate', (data) => {
                if (activeNote && data.noteId === activeNote._id) {
                    setContent(data.content);
                }
                fetchNotes(); // Refresh list
            });
        }

        return () => {
            if (socket) socket.off('receiveNoteUpdate');
        };
    }, [workspaceId, activeNote, socket]);

    const fetchNotes = async () => {
        try {
            const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/notes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setNotes(data);
            if (!activeNote && data.length > 0) {
                setActiveNote(data[0]);
                setContent(data[0].content);
            } else if (data.length === 0) {
                // Create a default first note if none exist
                setActiveNote({ title: 'General notes', content: '' });
                setContent('');
            }
        } catch (err) {
            console.error('Fetch Notes Error:', err);
        }
    };

    const handleSave = async (newContent) => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/notes`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    workspaceId,
                    title: activeNote.title,
                    content: newContent || content
                })
            });
            if (res.ok) {
                const updatedNote = await res.json();
                setActiveNote(updatedNote);
                // Broadcast via socket
                if (socket) {
                    socket.emit('noteUpdate', {
                        workspaceId,
                        noteId: updatedNote._id,
                        content: updatedNote.content,
                        updatedBy: 'me'
                    });
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleContentChange = (e) => {
        const val = e.target.value;
        setContent(val);
        
        // Auto-save debounced
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            handleSave(val);
        }, 2000);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '1.5rem', height: '100%' }}>
            {/* Notes List */}
            <div className="glass-panel" style={{ padding: '1rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', opacity: 0.7 }}>SHARED NOTES</h4>
                {notes.map(n => (
                    <button
                        key={n._id}
                        onClick={() => { setActiveNote(n); setContent(n.content); }}
                        style={{
                            textAlign: 'left', padding: '0.75rem', borderRadius: '10px',
                            background: activeNote?._id === n._id ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
                            border: 'none', color: 'white', cursor: 'pointer', transition: '0.2s'
                        }}
                    >
                        {n.title}
                    </button>
                ))}
                <button
                    onClick={() => { setActiveNote({ title: 'New Note', content: '' }); setContent(''); }}
                    style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--border)', color: 'white', padding: '0.8rem', borderRadius: '10px', cursor: 'pointer' }}
                >
                    + Add New Note
                </button>
            </div>

            {/* Editor Area */}
            <div className="glass-panel" style={{ borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <header style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h3 style={{ margin: 0 }}>{activeNote?.title}</h3>
                        {saving && <Loader2 size={16} className="spin" style={{ color: 'var(--accent)' }} />}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '4px' }}>
                        <button 
                            onClick={() => setIsEditing(true)}
                            style={{ 
                                background: isEditing ? 'var(--accent)' : 'transparent', 
                                border: 'none', color: 'white', padding: '6px 12px', 
                                borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                            }}
                        >
                            <Edit3 size={14} /> Edit
                        </button>
                        <button 
                            onClick={() => setIsEditing(false)}
                            style={{ 
                                background: !isEditing ? 'var(--accent)' : 'transparent', 
                                border: 'none', color: 'white', padding: '6px 12px', 
                                borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                            }}
                        >
                            <Eye size={14} /> Preview
                        </button>
                    </div>
                </header>

                <div style={{ flex: 1, position: 'relative' }}>
                    {isEditing ? (
                        <textarea
                            value={content}
                            onChange={handleContentChange}
                            placeholder="Start writing notes... (Markdown supported)"
                            style={{
                                width: '100%', height: '100%', background: 'transparent',
                                border: 'none', padding: '1.5rem', color: 'white',
                                fontSize: '1rem', lineHeight: '1.6', outline: 'none',
                                resize: 'none', fontFamily: 'Inter, sans-serif'
                            }}
                        />
                    ) : (
                        <div style={{ padding: '2rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.8' }}>
                            {/* Simple Markdown Render (Mock) */}
                            <div style={{ whiteSpace: 'pre-wrap' }}>{content || 'Nothing to preview...'}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SharedNotes;
