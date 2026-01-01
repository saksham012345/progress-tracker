import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, User, Bot } from 'lucide-react';
import { API_URL } from '../config';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I am your AI Study Assistant. Ask me anything!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Send entire history for context
            // Send entire history for context
            const res = await fetch(`${API_URL}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    history: messages // Send previous context
                })
            });
            const data = await res.json();

            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to my brain right now." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        style={{
                            position: 'absolute',
                            bottom: '80px',
                            right: '0',
                            width: '350px',
                            height: '500px',
                            background: 'var(--card-bg)',
                            borderRadius: '16px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--accent)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Bot size={20} />
                                <span style={{ fontWeight: 600 }}>AI Assistant</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {messages.map((msg, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    alignItems: 'flex-start',
                                    gap: '0.5rem'
                                }}>
                                    {msg.role === 'assistant' && (
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Bot size={16} color="white" />
                                        </div>
                                    )}
                                    <div style={{
                                        maxWidth: '75%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '12px',
                                        background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-color)',
                                        color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                        border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.5'
                                    }}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                    <div style={{ background: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: '12px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        Thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about your studies..."
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-color)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                style={{
                                    background: 'var(--accent)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    width: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    opacity: !input.trim() || loading ? 0.5 : 1
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                }}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </motion.button>
        </div>
    );
};

export default ChatWidget;
