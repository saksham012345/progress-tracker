import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { API_URL } from '../config';
import { Send, Users, ArrowLeft, Loader2, Sparkles, MessageSquare, Book, Database, PlayCircle, UserPlus, Search, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SharedNotes from '../components/SharedNotes';
import KnowledgeHub from '../components/KnowledgeHub';

const WorkspaceDetail = () => {
    const { id } = useParams();
    const { token, user } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [workspace, setWorkspace] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('chat');
    const [studyingUsers, setStudyingUsers] = useState([]);
    const scrollRef = useRef();

    // Member invite state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [addingUser, setAddingUser] = useState(null);
    const [addedUsers, setAddedUsers] = useState([]);
    const searchTimeout = useRef();

    useEffect(() => {
        fetchWorkspaceData();
        
        if (socket) {
            socket.emit('joinWorkspace', id);

            socket.on('receiveMessage', (message) => {
                setMessages((prev) => [...prev, message]);
            });

            socket.on('userStartedStudy', (data) => {
                setStudyingUsers((prev) => [...prev.filter(u => u.userId !== data.userId), data]);
            });

            socket.on('userStoppedStudy', (data) => {
                setStudyingUsers((prev) => prev.filter(u => u.userId !== data.userId));
            });
        }

        return () => {
            if (socket) {
                socket.off('receiveMessage');
                socket.off('userStartedStudy');
                socket.off('userStoppedStudy');
            }
        };
    }, [id, socket]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchWorkspaceData = async () => {
        try {
            const [wsRes, msgRes] = await Promise.all([
                fetch(`${API_URL}/api/workspaces`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_URL}/api/workspaces/${id}/chat`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (wsRes.ok) {
                const wsData = await wsRes.json();
                const currentWs = wsData.find(w => w._id === id);
                setWorkspace(currentWs);
            }
            if (msgRes.ok) {
                const msgData = await msgRes.json();
                setMessages(msgData);
            }
        } catch (err) {
            console.error('Fetch Workspace Detail Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            workspaceId: id,
            senderId: user.id || user._id,
            senderName: user.username,
            text: newMessage
        };

        if (socket) socket.emit('sendMessage', messageData);
        setNewMessage('');
    };

    // User search for adding members
    const handleSearch = (query) => {
        setSearchQuery(query);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const res = await fetch(`${API_URL}/api/auth/search?q=${encodeURIComponent(query)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    // Filter out users already in workspace
                    const memberIds = workspace?.members?.map(m => typeof m === 'string' ? m : m._id) || [];
                    const filtered = data.filter(u => !memberIds.includes(u._id));
                    setSearchResults(filtered);
                }
            } catch (err) {
                console.error('Search Error:', err);
            } finally {
                setSearching(false);
            }
        }, 400);
    };

    const handleAddMember = async (userId) => {
        setAddingUser(userId);
        try {
            const res = await fetch(`${API_URL}/api/workspaces/${id}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                setAddedUsers(prev => [...prev, userId]);
                // Remove from search results
                setSearchResults(prev => prev.filter(u => u._id !== userId));
                // Refresh workspace data
                fetchWorkspaceData();
                setTimeout(() => setAddedUsers(prev => prev.filter(id => id !== userId)), 2000);
            }
        } catch (err) {
            console.error('Add Member Error:', err);
        } finally {
            setAddingUser(null);
        }
    };

    const isOwner = workspace?.owner?._id === (user.id || user._id) || workspace?.owner === (user.id || user._id);

    if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Loading Workspace...</div>;
    if (!workspace) return <div style={{ textAlign: 'center', padding: '5rem' }}>Workspace not found.</div>;

    return (
        <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/workspaces">
                        <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}>
                            <ArrowLeft size={20} />
                        </button>
                    </Link>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>{workspace.name}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            <Users size={14} />
                            <span>{workspace.members?.length || 0} Members</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                     {studyingUsers.length > 0 && (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="pulse" style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%' }} />
                            <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>{studyingUsers.length} studying now</span>
                         </div>
                     )}
                </div>
            </header>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '16px', width: 'fit-content' }}>
                {[
                    { id: 'chat', label: 'Chat', icon: <MessageSquare size={16} /> },
                    { id: 'notes', label: 'Shared Notes', icon: <Book size={16} /> },
                    { id: 'knowledge', label: 'Knowledge Hub', icon: <Database size={16} /> },
                    { id: 'members', label: 'Members', icon: <Users size={16} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                            border: 'none', color: 'white', padding: '0.6rem 1.2rem',
                            borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            fontWeight: 600, transition: '0.2s'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
                <AnimatePresence mode="wait">
                    {activeTab === 'chat' && (
                        <motion.div 
                            key="chat"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            style={{ height: '100%', display: 'flex', gap: '1.5rem' }}
                        >
                            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '24px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                                {/* Chat Area */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {messages.map((msg, index) => {
                                        const isMe = msg.senderId === (user.id || user._id);
                                        return (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                style={{
                                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                                    maxWidth: '70%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: isMe ? 'flex-end' : 'flex-start'
                                                }}
                                            >
                                                {!isMe && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', marginLeft: '0.5rem' }}>{msg.senderName}</span>}
                                                <div style={{
                                                    padding: '0.8rem 1.2rem',
                                                    borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                    background: isMe ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                                    color: 'white',
                                                    boxShadow: isMe ? '0 4px 15px var(--accent-glow)' : 'none',
                                                    fontSize: '0.95rem'
                                                }}>
                                                    {msg.text}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                    <div ref={scrollRef} />
                                </div>
                                {/* Input Area */}
                                <form onSubmit={handleSendMessage} style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        style={{
                                            flex: 1,
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            padding: '0.8rem 1.2rem',
                                            color: 'white',
                                            outline: 'none'
                                        }}
                                    />
                                    <button type="submit" className="accent-button" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }}>
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>

                            {/* Right Sidebar - Active Members */}
                            <div className="glass-panel" style={{ width: '280px', borderRadius: '24px', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '1.5rem', color: 'var(--accent)' }}>LIVE PRESENCE</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {studyingUsers.length === 0 ? (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nobody in the study room yet.</p>
                                    ) : (
                                        studyingUsers.map(u => (
                                            <div key={u.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <div style={{ width: '40px', height: '40px', background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                                        {u.username[0]}
                                                    </div>
                                                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', background: '#34d399', borderRadius: '50%', border: '2px solid #000' }} />
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{u.username}</p>
                                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#34d399' }}>studying {u.topicTitle}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'notes' && (
                        <motion.div 
                            key="notes"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            style={{ height: '100%' }}
                        >
                            <SharedNotes workspaceId={id} token={token} socket={socket} />
                        </motion.div>
                    )}

                    {activeTab === 'knowledge' && (
                        <motion.div 
                            key="knowledge"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{ height: '100%' }}
                        >
                            <KnowledgeHub workspaceId={id} token={token} />
                        </motion.div>
                    )}

                    {activeTab === 'members' && (
                        <motion.div
                            key="members"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            style={{ height: '100%', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: isOwner ? '1fr 1fr' : '1fr', gap: '2rem', maxWidth: '900px' }}>
                                {/* Current Members */}
                                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
                                    <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={20} color="var(--accent)" /> Current Members
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {/* Owner */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            padding: '1rem', borderRadius: '14px',
                                            background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))',
                                            border: '1px solid rgba(168,85,247,0.2)'
                                        }}>
                                            <div style={{
                                                width: '44px', height: '44px', borderRadius: '50%',
                                                background: 'linear-gradient(135deg, var(--accent), #a855f7)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontWeight: 800, fontSize: '1.1rem'
                                            }}>
                                                {(workspace.owner?.username || 'O')[0].toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
                                                    {workspace.owner?.username || 'Owner'}
                                                </p>
                                                <span style={{
                                                    fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px',
                                                    background: 'rgba(168,85,247,0.2)', color: '#c084fc',
                                                    fontWeight: 600, letterSpacing: '0.5px'
                                                }}>
                                                    OWNER
                                                </span>
                                            </div>
                                        </div>

                                        {/* Other Members */}
                                        {workspace.members?.filter(m => {
                                            const mId = typeof m === 'string' ? m : m._id;
                                            const ownerId = typeof workspace.owner === 'string' ? workspace.owner : workspace.owner?._id;
                                            return mId !== ownerId;
                                        }).map((member, idx) => {
                                            const memberName = typeof member === 'string' ? `Member ${idx + 1}` : member.username || `Member ${idx + 1}`;
                                            return (
                                                <motion.div
                                                    key={typeof member === 'string' ? member : member._id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                                        padding: '0.8rem 1rem', borderRadius: '14px',
                                                        background: 'rgba(255,255,255,0.03)',
                                                        border: '1px solid rgba(255,255,255,0.05)'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '40px', height: '40px', borderRadius: '50%',
                                                        background: 'rgba(255,255,255,0.1)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: 'white', fontWeight: 700
                                                    }}>
                                                        {memberName[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{memberName}</p>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Member</span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}

                                        {workspace.members?.length <= 1 && (
                                            <div style={{ textAlign: 'center', padding: '2rem 1rem', opacity: 0.4 }}>
                                                <UserPlus size={32} style={{ marginBottom: '0.5rem' }} />
                                                <p style={{ margin: 0, fontSize: '0.85rem' }}>No other members yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Add Members (only for owner) */}
                                {isOwner && (
                                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
                                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <UserPlus size={20} color="var(--accent)" /> Invite Members
                                        </h3>

                                        {/* Search Input */}
                                        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                            <input
                                                type="text"
                                                placeholder="Search by username..."
                                                value={searchQuery}
                                                onChange={(e) => handleSearch(e.target.value)}
                                                style={{
                                                    width: '100%', padding: '0.9rem 1rem 0.9rem 3rem',
                                                    borderRadius: '12px', border: '1px solid var(--border)',
                                                    background: 'rgba(0,0,0,0.2)', color: 'white',
                                                    outline: 'none', fontSize: '0.95rem',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                                                    style={{
                                                        position: 'absolute', right: '0.8rem', top: '50%',
                                                        transform: 'translateY(-50%)', background: 'none',
                                                        border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
                                                    }}
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Search Results */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            {searching && (
                                                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
                                                    <Loader2 size={20} className="spin" style={{ marginBottom: '0.3rem' }} />
                                                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Searching...</p>
                                                </div>
                                            )}

                                            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                                                <div style={{ textAlign: 'center', padding: '2rem 1rem', opacity: 0.5 }}>
                                                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No users found matching "{searchQuery}"</p>
                                                </div>
                                            )}

                                            <AnimatePresence>
                                                {searchResults.map(u => (
                                                    <motion.div
                                                        key={u._id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                                            padding: '0.8rem 1rem', borderRadius: '14px',
                                                            background: 'rgba(255,255,255,0.03)',
                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                            transition: 'border 0.2s'
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '40px', height: '40px', borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: 'white', fontWeight: 700
                                                        }}>
                                                            {u.username[0].toUpperCase()}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{u.username}</p>
                                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</p>
                                                        </div>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleAddMember(u._id)}
                                                            disabled={addingUser === u._id || addedUsers.includes(u._id)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                                padding: '0.5rem 1rem', borderRadius: '10px',
                                                                background: addedUsers.includes(u._id) ? 'var(--success)' : 'var(--accent)',
                                                                color: 'white', border: 'none', fontWeight: 600,
                                                                fontSize: '0.8rem', cursor: addingUser === u._id ? 'not-allowed' : 'pointer',
                                                                opacity: addingUser === u._id ? 0.7 : 1
                                                            }}
                                                        >
                                                            {addedUsers.includes(u._id) ? (
                                                                <><CheckCircle size={14} /> Added</>
                                                            ) : addingUser === u._id ? (
                                                                <><Loader2 size={14} className="spin" /> Adding...</>
                                                            ) : (
                                                                <><UserPlus size={14} /> Add</>
                                                            )}
                                                        </motion.button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>

                                            {!searchQuery && (
                                                <div style={{ textAlign: 'center', padding: '2rem 1rem', opacity: 0.3 }}>
                                                    <Search size={32} style={{ marginBottom: '0.5rem' }} />
                                                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Search for users to invite to this workspace</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WorkspaceDetail;
