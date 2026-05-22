import React, { useState, useRef, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Trash2, Loader2 } from 'lucide-react';
import { API_URL } from '../config';
import { AuthContext } from '../context/AuthContext';

const SUGGESTED = [
    "What should I study next?",
    "Summarize my progress",
    "Which topics need review?",
    "Give me a study tip"
];

const ChatWidget = () => {
    const { token } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I\'m your AI Study Coach. I remember your learning history — ask me anything!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load persisted chat history when widget opens
    useEffect(() => {
        if (isOpen && !historyLoaded && token) {
            loadHistory();
        }
    }, [isOpen, historyLoaded, token]);

    const loadHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/api/ai/chat-history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                    setMessages([
                        { role: 'assistant', content: 'Welcome back! I remember our previous conversations.' },
                        ...data.map(m => ({ role: m.role, content: m.content }))
                    ]);
                }
            }
        } catch (err) { console.error('Load history error:', err); }
        finally { setHistoryLoaded(true); }
    };

    const clearHistory = async () => {
        try {
            await fetch(`${API_URL}/api/ai/chat-history`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessages([{ role: 'assistant', content: 'Chat history cleared. Fresh start!' }]);
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e, overrideMsg) => {
        e?.preventDefault();
        const msg = overrideMsg || input;
        if (!msg.trim()) return;

        const userMsg = { role: 'user', content: msg };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: msg,
                    history: messages.slice(-10) // send last 10 for context window
                })
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.message || 'Sorry, something went wrong.' }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting. Make sure the AI service is running." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        style={{ position: 'absolute', bottom: '80px', right: '0', width: '380px', height: '540px', background: 'var(--card-bg)', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                    >
                        {/* Header */}
                        <div style={{ padding: '1rem 1.2rem', borderBottom: '1px solid var(--border)', background: 'var(--accent)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Bot size={20} />
                                <div>
                                    <span style={{ fontWeight: 700, display: 'block', fontSize: '0.95rem' }}>AI Study Coach</span>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Remembers your learning history</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={clearHistory} title="Clear history" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                                    <Trash2 size={16} />
                                </button>
                                <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {messages.map((msg, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    {msg.role === 'assistant' && (
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Bot size={16} color="white" />
                                        </div>
                                    )}
                                    <div style={{ maxWidth: '78%', padding: '0.7rem 1rem', borderRadius: '14px', background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-color)', color: msg.role === 'user' ? 'white' : 'var(--text-primary)', border: msg.role === 'user' ? 'none' : '1px solid var(--border)', fontSize: '0.88rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Bot size={16} color="white" />
                                    </div>
                                    <div style={{ background: 'var(--bg-color)', padding: '0.7rem 1rem', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Loader2 size={14} className="spin" />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Thinking... (2–5s)</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggested prompts (only when few messages) */}
                        {messages.length <= 2 && (
                            <div style={{ padding: '0 1rem 0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {SUGGESTED.map(s => (
                                    <button key={s} onClick={() => handleSubmit(null, s)} style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--accent)', cursor: 'pointer' }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <form onSubmit={handleSubmit} style={{ padding: '0.8rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ask your coach..."
                                style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                            />
                            <button type="submit" disabled={!input.trim() || loading} style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '10px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: !input.trim() || loading ? 0.5 : 1 }}>
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent)', color: 'white', border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </motion.button>
        </div>
    );
};

export default ChatWidget;
