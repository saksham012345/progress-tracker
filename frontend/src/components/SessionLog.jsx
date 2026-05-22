import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Wand2, Trash2, Loader2, CheckCircle } from 'lucide-react';

const MOODS = ['Great', 'Good', 'Okay', 'Tired', 'Frustrated'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const moodEmoji = { Great: '😄', Good: '🙂', Okay: '😐', Tired: '😴', Frustrated: '😤' };

const SessionLog = ({ sessions, onAddSession, onDeleteSession, onImproveNotes, onSaveImprovedNotes }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newSession, setNewSession] = useState({ duration: '', notes: '', mood: 'Good', difficulty: 'Medium' });
    const [improvingId, setImprovingId] = useState(null);
    const [improvedNotes, setImprovedNotes] = useState({});
    const [savedIds, setSavedIds] = useState({});
    const [savingId, setSavingId] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddSession(newSession);
        setNewSession({ duration: '', notes: '', mood: 'Good', difficulty: 'Medium' });
        setIsAdding(false);
    };

    const handleImprove = async (session) => {
        setImprovingId(session._id);
        try {
            const improved = await onImproveNotes(session._id, session.notes);
            if (improved) setImprovedNotes(prev => ({ ...prev, [session._id]: improved }));
        } catch (err) { console.error(err); }
        finally { setImprovingId(null); }
    };

    const acceptImproved = async (sessionId) => {
        if (!onSaveImprovedNotes) {
            // No persist callback — just mark visually
            setSavedIds(prev => ({ ...prev, [sessionId]: true }));
            setTimeout(() => setSavedIds(prev => { const n = { ...prev }; delete n[sessionId]; return n; }), 2000);
            return;
        }
        setSavingId(sessionId);
        try {
            await onSaveImprovedNotes(sessionId, improvedNotes[sessionId]);
            setSavedIds(prev => ({ ...prev, [sessionId]: true }));
            setTimeout(() => setSavedIds(prev => { const n = { ...prev }; delete n[sessionId]; return n; }), 2000);
        } catch (err) { console.error(err); }
        finally { setSavingId(null); }
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Study Sessions <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({sessions.length})</span></h3>
                <button onClick={() => setIsAdding(!isAdding)} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={16} /> Log Session
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleSubmit} style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Duration (minutes)</label>
                                <input type="number" value={newSession.duration} onChange={e => setNewSession({ ...newSession, duration: e.target.value })} required style={{ width: '100%', background: 'var(--bg-color)', border: '1px solid var(--border)', padding: '0.7rem', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Mood</label>
                                <select value={newSession.mood} onChange={e => setNewSession({ ...newSession, mood: e.target.value })} style={{ width: '100%', background: 'var(--bg-color)', border: '1px solid var(--border)', padding: '0.7rem', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }}>
                                    {MOODS.map(m => <option key={m} value={m}>{moodEmoji[m]} {m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Difficulty</label>
                                <select value={newSession.difficulty} onChange={e => setNewSession({ ...newSession, difficulty: e.target.value })} style={{ width: '100%', background: 'var(--bg-color)', border: '1px solid var(--border)', padding: '0.7rem', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }}>
                                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Notes</label>
                            <textarea value={newSession.notes} onChange={e => setNewSession({ ...newSession, notes: e.target.value })} required rows={4} style={{ width: '100%', background: 'var(--bg-color)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '8px', color: 'white', resize: 'vertical', boxSizing: 'border-box' }} />
                        </div>
                        <button type="submit" style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                            Save Session
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sessions.map((session, index) => (
                    <motion.div key={session._id || index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} style={{ background: 'var(--card-bg)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{new Date(session.date).toLocaleDateString()}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontSize: '0.9rem' }}>
                                    <Clock size={14} />
                                    <span>{session.duration} min</span>
                                </div>
                                {session.mood && <span style={{ fontSize: '0.8rem' }}>{moodEmoji[session.mood]} {session.mood}</span>}
                                {session.difficulty && <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>{session.difficulty}</span>}
                            </div>
                            {onDeleteSession && (
                                <button onClick={() => onDeleteSession(session._id)} style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.4)', cursor: 'pointer' }}>
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>

                        {/* Notes — show improved version if available */}
                        <p style={{ whiteSpace: 'pre-wrap', marginBottom: '0.75rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                            {improvedNotes[session._id] || session.notes}
                        </p>

                        {/* Improved notes actions */}
                        <AnimatePresence>
                            {improvedNotes[session._id] && !savedIds[session._id] && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.5rem', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--success)', flex: 1 }}>✨ AI improved your notes</span>
                                    <button onClick={() => acceptImproved(session._id)} disabled={savingId === session._id} style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                        {savingId === session._id ? 'Saving...' : 'Accept'}
                                    </button>
                                    <button onClick={() => setImprovedNotes(prev => { const n = { ...prev }; delete n[session._id]; return n; })} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem' }}>Discard</button>
                                </motion.div>
                            )}
                            {savedIds[session._id] && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
                                    <CheckCircle size={14} /> Notes updated
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button onClick={() => handleImprove(session)} disabled={improvingId === session._id} style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                            {improvingId === session._id ? <><Loader2 size={14} className="spin" /> Improving...</> : <><Wand2 size={14} /> AI Improve Notes</>}
                        </button>
                    </motion.div>
                ))}
                {sessions.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No sessions logged yet. Start a Pomodoro or log a session manually.</p>
                )}
            </div>
        </div>
    );
};

export default SessionLog;
