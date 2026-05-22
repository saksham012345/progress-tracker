import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { API_URL } from '../config';
import {
    Send, Users, ArrowLeft, Loader2, MessageSquare, Book,
    Database, UserPlus, Search, X, CheckCircle, Clock, Crown
} from 'lucide-react';
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

    // Invite state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [invitingId, setInvitingId] = useState(null);
    const [invitedIds, setInvitedIds] = useState(new Set());
    const searchTimeout = useRef();

    useEffect(() => {
        fetchWorkspaceData();
    }, [id]);

    useEffect(() => {
        if (!socket) return;
        socket.emit('joinWorkspace', id);

        const onMsg = (msg) => setMessages(prev => [...prev, msg]);
        const onStartStudy = (data) => setStudyingUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
        const onStopStudy = (data) => setStudyingUsers(prev => prev.filter(u => u.userId !== data.userId));
        const onNoteUpdate = (data) => {}; // handled inside SharedNotes

        socket.on('receiveMessage', onMsg);
        socket.on('userStartedStudy', onStartStudy);
        socket.on('userStoppedStudy', onStopStudy);

        return () => {
            socket.off('receiveMessage', onMsg);
            socket.off('userStartedStudy', onStartStudy);
            socket.off('userStoppedStudy', onStopStudy);
        };
    }, [id, socket]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchWorkspaceData = async () => {
        try {
            const [wsRes, msgRes] = await Promise.all([
                fetch(`${API_URL}/api/workspaces`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/workspaces/${id}/chat`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (wsRes.ok) {
                const wsData = await wsRes.json();
                setWorkspace(wsData.find(w => w._id === id) || null);
            }
            if (msgRes.ok) setMessages(await msgRes.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;
        socket.emit('sendMessage', {
            workspaceId: id,
            senderId: user.id || user._id,
            senderName: user.username,
            text: newMessage
        });
        setNewMessage('');
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        clearTimeout(searchTimeout.current);
        if (query.length < 2) { setSearchResults([]); return; }
        setSearching(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const res = await fetch(`${API_URL}/api/auth/search?q=${encodeURIComponent(query)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const memberIds = new Set(workspace?.members?.map(m => m._id || m) || []);
                    setSearchResults(data.filter(u => !memberIds.has(u._id)));
                }
            } catch (err) { console.error(err); }
            finally { setSearching(false); }
        }, 400);
    };

    const handleSendInvite = async (targetUser) => {
        setInvitingId(targetUser._id);
        try {
            const res = await fetch(`${API_URL}/api/workspaces/${id}/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId: targetUser._id, ownerName: user.username })
            });
            if (res.ok) {
                setInvitedIds(prev => new Set([...prev, targetUser._id]));
                setSearchResults(prev => prev.filter(u => u._id !== targetUser._id));
            }
        } catch (err) { console.error(err); }
        finally { setInvitingId(null); }
    };

    const isOwner = workspace?.owner?._id === (user?.id || user?._id) ||
        workspace?.owner === (user?.id || user?._id);

    const myId = user?.id || user?._id;

    if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}><Loader2 size={32} className="spin" color="var(--accent)" /></div>;
    if (!workspace) return <div style={{ textAlign: 'center', padding: '5rem' }}>Workspace not found.</div>;

    const tabs = [
        { id: 'chat', label: 'Chat', icon: <MessageSquare size={16} /> },
        { id: 'notes', label: 'Shared Notes', icon: <Book size={16} /> },
        { id: 'knowledge', label: 'Knowledge Hub', icon: <Database size={16} /> },
        { id: 'members', label: 'Members', icon: <Users size={16} /> }
    ];

    return (
        <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
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
                {studyingUsers.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="pulse" style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%' }} />
                        <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>{studyingUsers.length} studying now</span>
                    </div>
                )}
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '16px', width: 'fit-content' }}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        style={{ background: activeTab === tab.id ? 'var(--accent)' : 'transparent', border: 'none', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, transition: '0.2s' }}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
                <AnimatePresence mode="wait">
                    {/* ── Chat ── */}
                    {activeTab === 'chat' && (
                        <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ height: '100%', display: 'flex', gap: '1.5rem' }}>
                            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '24px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {messages.map((msg, i) => {
                                        const isMe = msg.senderId === myId || msg.senderId?._id === myId;
                                        return (
                                            <motion.div key={i} initial={{ opacity: 0, x: isMe ? 20 : -20 }} animate={{ opacity: 1, x: 0 }}
                                                style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                                {!isMe && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', marginLeft: '0.5rem' }}>{msg.senderName}</span>}
                                                <div style={{ padding: '0.8rem 1.2rem', borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px', background: isMe ? 'var(--accent)' : 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.95rem' }}>
                                                    {msg.text}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                    <div ref={scrollRef} />
                                </div>
                                <form onSubmit={handleSendMessage} style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem' }}>
                                    <input type="text" placeholder="Type your message..." value={newMessage} onChange={e => setNewMessage(e.target.value)}
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.8rem 1.2rem', color: 'white', outline: 'none' }} />
                                    <button type="submit" style={{ background: 'var(--accent)', border: 'none', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '12px', cursor: 'pointer' }}>
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>

                            {/* Live presence sidebar */}
                            <div className="glass-panel" style={{ width: '240px', borderRadius: '24px', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                <h3 style={{ fontSize: '0.8rem', marginTop: 0, marginBottom: '1.5rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Presence</h3>
                                {studyingUsers.length === 0
                                    ? <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nobody studying yet.</p>
                                    : studyingUsers.map(u => (
                                        <div key={u.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <div style={{ width: '36px', height: '36px', background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                                                    {u.username?.[0]?.toUpperCase()}
                                                </div>
                                                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '9px', height: '9px', background: '#34d399', borderRadius: '50%', border: '2px solid #000' }} />
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{u.username}</p>
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#34d399' }}>studying {u.topicTitle}</p>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </motion.div>
                    )}

                    {/* ── Shared Notes ── */}
                    {activeTab === 'notes' && (
                        <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {/* Markdown hint bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.6rem 1.2rem', background: 'rgba(99,102,241,0.08)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>✦ Markdown supported</span>
                                {[['**bold**','bold'], ['*italic*','italic'], ['# Heading','heading'], ['- item','list'], ['`code`','code'], ['> quote','quote'], ['[text](url)','link']].map(([syntax, label]) => (
                                    <span key={label}><code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', color: '#c084fc' }}>{syntax}</code></span>
                                ))}
                                <span style={{ marginLeft: 'auto', opacity: 0.6 }}>Switch to Preview to render</span>
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <SharedNotes workspaceId={id} token={token} socket={socket} />
                            </div>
                        </motion.div>
                    )}

                    {/* ── Knowledge Hub ── */}
                    {activeTab === 'knowledge' && (
                        <motion.div key="knowledge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
                            <KnowledgeHub workspaceId={id} token={token} />
                        </motion.div>
                    )}

                    {/* ── Members ── */}
                    {activeTab === 'members' && (
                        <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ height: '100%', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isOwner ? '1fr 1fr' : '1fr', gap: '2rem', maxWidth: '900px' }}>

                                {/* Current Members — now shows real names */}
                                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
                                    <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={20} color="var(--accent)" /> Members ({workspace.members?.length || 0})
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {workspace.members?.map((member, idx) => {
                                            // member is populated: { _id, username, email }
                                            const memberId = member._id || member;
                                            const memberName = member.username || 'Unknown';
                                            const ownerIdStr = workspace.owner?._id || workspace.owner;
                                            const isThisOwner = memberId?.toString() === ownerIdStr?.toString();
                                            const isMe = memberId?.toString() === myId?.toString();

                                            return (
                                                <motion.div key={memberId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem', borderRadius: '14px', background: isThisOwner ? 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))' : 'rgba(255,255,255,0.03)', border: `1px solid ${isThisOwner ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.05)'}` }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: isThisOwner ? 'linear-gradient(135deg, var(--accent), #a855f7)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                                                        {memberName[0].toUpperCase()}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>
                                                            {memberName} {isMe && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>(you)</span>}
                                                        </p>
                                                        {isThisOwner
                                                            ? <span style={{ fontSize: '0.7rem', padding: '1px 8px', borderRadius: '20px', background: 'rgba(168,85,247,0.2)', color: '#c084fc', fontWeight: 600 }}>OWNER</span>
                                                            : <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Member</span>
                                                        }
                                                    </div>
                                                    {isThisOwner && <Crown size={16} color="#c084fc" />}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Invite panel — owner only */}
                                {isOwner && (
                                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
                                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <UserPlus size={20} color="var(--accent)" /> Send Invite
                                        </h3>
                                        <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                            Search for a user and send them an invite. They'll see it on their Dashboard and can accept or reject.
                                        </p>

                                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                            <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                            <input type="text" placeholder="Search by username..." value={searchQuery} onChange={e => handleSearch(e.target.value)}
                                                style={{ width: '100%', padding: '0.8rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                                            {searchQuery && (
                                                <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                                                    style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {searching && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Searching...</p>}
                                            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', opacity: 0.6 }}>No users found matching "{searchQuery}"</p>
                                            )}
                                            <AnimatePresence>
                                                {searchResults.map(u => (
                                                    <motion.div key={u._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                                                            {u.username[0].toUpperCase()}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{u.username}</p>
                                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleSendInvite(u)}
                                                            disabled={invitingId === u._id || invitedIds.has(u._id)}
                                                            style={{ padding: '0.4rem 0.9rem', borderRadius: '8px', border: 'none', background: invitedIds.has(u._id) ? 'rgba(16,185,129,0.15)' : 'var(--accent)', color: invitedIds.has(u._id) ? 'var(--success)' : 'white', fontWeight: 600, fontSize: '0.8rem', cursor: invitedIds.has(u._id) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            {invitingId === u._id ? <Loader2 size={14} className="spin" /> : invitedIds.has(u._id) ? <><CheckCircle size={14} /> Sent</> : <><UserPlus size={14} /> Invite</>}
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>

                                        {/* Pending invites list */}
                                        {workspace.invites?.filter(i => i.status === 'pending').length > 0 && (
                                            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                                <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Invites</p>
                                                {workspace.invites.filter(i => i.status === 'pending').map(inv => (
                                                    <div key={inv._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        <Clock size={14} />
                                                        <span>Invite sent · awaiting response</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
