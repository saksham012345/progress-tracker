import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, Sparkles, Edit3, Eye, Bold, Italic, List, Heading, Code, Link2, Image, Quote } from 'lucide-react';
import { API_URL } from '../config';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Markdown preview styles
const markdownStyles = {
    h1: { fontSize: '2rem', fontWeight: 800, margin: '1.5rem 0 1rem', letterSpacing: '-0.02em', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' },
    h2: { fontSize: '1.5rem', fontWeight: 700, margin: '1.3rem 0 0.8rem', letterSpacing: '-0.01em' },
    h3: { fontSize: '1.2rem', fontWeight: 600, margin: '1rem 0 0.6rem' },
    p: { margin: '0.6rem 0', lineHeight: 1.8 },
    blockquote: {
        borderLeft: '3px solid var(--accent)', paddingLeft: '1rem',
        margin: '1rem 0', color: 'rgba(255,255,255,0.7)',
        background: 'rgba(99, 102, 241, 0.05)', padding: '0.8rem 1rem',
        borderRadius: '0 10px 10px 0'
    },
    code: {
        background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.5rem',
        borderRadius: '6px', fontFamily: '"Fira Code", "Cascadia Code", monospace',
        fontSize: '0.85em', color: '#c084fc'
    },
    pre: {
        background: 'rgba(0,0,0,0.4)', padding: '1rem 1.2rem',
        borderRadius: '12px', overflow: 'auto', margin: '1rem 0',
        border: '1px solid rgba(255,255,255,0.06)'
    },
    ul: { paddingLeft: '1.5rem', margin: '0.5rem 0' },
    ol: { paddingLeft: '1.5rem', margin: '0.5rem 0' },
    li: { margin: '0.3rem 0', lineHeight: 1.7 },
    a: { color: 'var(--accent)', textDecoration: 'underline' },
    table: {
        width: '100%', borderCollapse: 'collapse', margin: '1rem 0',
        fontSize: '0.9rem'
    },
    th: {
        background: 'rgba(255,255,255,0.06)', padding: '0.7rem 1rem',
        textAlign: 'left', fontWeight: 600,
        borderBottom: '2px solid rgba(255,255,255,0.1)'
    },
    td: {
        padding: '0.6rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
    },
    hr: { border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1.5rem 0' },
    img: { maxWidth: '100%', borderRadius: '12px', margin: '1rem 0' }
};

const MarkdownComponents = {
    h1: ({ children }) => <h1 style={markdownStyles.h1}>{children}</h1>,
    h2: ({ children }) => <h2 style={markdownStyles.h2}>{children}</h2>,
    h3: ({ children }) => <h3 style={markdownStyles.h3}>{children}</h3>,
    p: ({ children }) => <p style={markdownStyles.p}>{children}</p>,
    blockquote: ({ children }) => <blockquote style={markdownStyles.blockquote}>{children}</blockquote>,
    code: ({ inline, children, className }) => {
        if (inline) return <code style={markdownStyles.code}>{children}</code>;
        return (
            <pre style={markdownStyles.pre}>
                <code style={{ fontFamily: '"Fira Code", "Cascadia Code", monospace', fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>
                    {children}
                </code>
            </pre>
        );
    },
    ul: ({ children }) => <ul style={markdownStyles.ul}>{children}</ul>,
    ol: ({ children }) => <ol style={markdownStyles.ol}>{children}</ol>,
    li: ({ children }) => <li style={markdownStyles.li}>{children}</li>,
    a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" style={markdownStyles.a}>{children}</a>,
    table: ({ children }) => <table style={markdownStyles.table}>{children}</table>,
    th: ({ children }) => <th style={markdownStyles.th}>{children}</th>,
    td: ({ children }) => <td style={markdownStyles.td}>{children}</td>,
    hr: () => <hr style={markdownStyles.hr} />,
    img: ({ src, alt }) => <img src={src} alt={alt} style={markdownStyles.img} />,
};

const SharedNotes = ({ workspaceId, token, socket }) => {
    const [notes, setNotes] = useState([]);
    const [activeNote, setActiveNote] = useState(null);
    const [content, setContent] = useState('');
    const [isEditing, setIsEditing] = useState(true);
    const [saving, setSaving] = useState(false);
    const timeoutRef = useRef();
    const textareaRef = useRef();

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

    // Toolbar helper: insert markdown syntax at cursor
    const insertMarkdown = (before, after = '') => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = content.substring(start, end);
        const newContent = content.substring(0, start) + before + selected + after + content.substring(end);
        setContent(newContent);

        // Reset cursor
        setTimeout(() => {
            ta.focus();
            const cursorPos = start + before.length + selected.length + after.length;
            ta.setSelectionRange(cursorPos, cursorPos);
        }, 0);

        // Auto-save
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => handleSave(newContent), 2000);
    };

    const toolbarButtons = [
        { icon: <Bold size={15} />, label: 'Bold', action: () => insertMarkdown('**', '**') },
        { icon: <Italic size={15} />, label: 'Italic', action: () => insertMarkdown('*', '*') },
        { icon: <Heading size={15} />, label: 'Heading', action: () => insertMarkdown('## ') },
        { icon: <List size={15} />, label: 'List', action: () => insertMarkdown('- ') },
        { icon: <Code size={15} />, label: 'Code', action: () => insertMarkdown('`', '`') },
        { icon: <Quote size={15} />, label: 'Quote', action: () => insertMarkdown('> ') },
        { icon: <Link2 size={15} />, label: 'Link', action: () => insertMarkdown('[', '](url)') },
    ];

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
                                borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                                fontWeight: isEditing ? 600 : 400
                            }}
                        >
                            <Edit3 size={14} /> Edit
                        </button>
                        <button 
                            onClick={() => setIsEditing(false)}
                            style={{ 
                                background: !isEditing ? 'var(--accent)' : 'transparent', 
                                border: 'none', color: 'white', padding: '6px 12px', 
                                borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                                fontWeight: !isEditing ? 600 : 400
                            }}
                        >
                            <Eye size={14} /> Preview
                        </button>
                    </div>
                </header>

                {/* Markdown Toolbar (only in edit mode) */}
                {isEditing && (
                    <div style={{
                        padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.15)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', gap: '0.3rem', flexWrap: 'wrap'
                    }}>
                        {toolbarButtons.map((btn) => (
                            <motion.button
                                key={btn.label}
                                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={btn.action}
                                title={btn.label}
                                style={{
                                    background: 'rgba(255,255,255,0.04)', border: 'none',
                                    color: 'rgba(255,255,255,0.6)', padding: '6px 10px',
                                    borderRadius: '8px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                                    fontSize: '0.8rem', transition: 'all 0.15s'
                                }}
                            >
                                {btn.icon}
                            </motion.button>
                        ))}
                        <span style={{
                            marginLeft: 'auto', fontSize: '0.75rem',
                            color: 'rgba(255,255,255,0.25)', alignSelf: 'center'
                        }}>
                            Markdown supported
                        </span>
                    </div>
                )}

                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    {isEditing ? (
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={handleContentChange}
                            placeholder={"Start writing notes...\n\nMarkdown is fully supported:\n# Heading 1\n## Heading 2\n**bold** and *italic*\n- bullet list\n> blockquote\n`inline code`\n```code block```"}
                            style={{
                                width: '100%', height: '100%', background: 'transparent',
                                border: 'none', padding: '1.5rem', color: 'white',
                                fontSize: '0.95rem', lineHeight: '1.7', outline: 'none',
                                resize: 'none', fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace',
                                boxSizing: 'border-box'
                            }}
                        />
                    ) : (
                        <div style={{
                            padding: '1.5rem 2rem', color: 'rgba(255,255,255,0.9)',
                            lineHeight: '1.8', overflowY: 'auto', height: '100%'
                        }}>
                            {content ? (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={MarkdownComponents}
                                >
                                    {content}
                                </ReactMarkdown>
                            ) : (
                                <div style={{ opacity: 0.3, textAlign: 'center', paddingTop: '3rem' }}>
                                    <Edit3 size={40} style={{ marginBottom: '1rem' }} />
                                    <p>Nothing to preview yet. Switch to Edit mode to start writing.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SharedNotes;
