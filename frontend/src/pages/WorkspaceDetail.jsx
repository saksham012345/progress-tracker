import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { API_URL } from '../config';
import { Send, Users, ArrowLeft, Loader2, Sparkles, MessageSquare, Book, Database, PlayCircle } from 'lucide-react';
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
                    { id: 'knowledge', label: 'Knowledge Hub', icon: <Database size={16} /> }
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
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WorkspaceDetail;
