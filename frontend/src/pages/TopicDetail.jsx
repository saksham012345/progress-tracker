import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Trash2, BrainCircuit, Play, StopCircle, Timer,
    CheckCircle, XCircle, Loader2, Trophy, RotateCcw, Volume2, Clock, Smile
} from 'lucide-react';
import SessionLog from '../components/SessionLog';
import { API_URL } from '../config';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';

// ── Audio helpers ─────────────────────────────────────────────────────────────
function playBeep(freq = 440, dur = 0.4, type = 'sine', vol = 0.5) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = type; osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur);
    } catch (e) {}
}
const playFocusDone = () => { playBeep(523,.15,'sine',.4); setTimeout(()=>playBeep(659,.15,'sine',.4),180); setTimeout(()=>playBeep(784,.35,'sine',.5),360); };
const playBreakDone = () => { playBeep(784,.2,'sine',.4); setTimeout(()=>playBeep(523,.35,'sine',.4),250); };

// ── Format seconds as mm:ss ───────────────────────────────────────────────────
const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

// ── AI loader with elapsed counter ───────────────────────────────────────────
const AILoader = ({ label = 'Generating...' }) => {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => { const t = setInterval(() => setElapsed(s => s+1), 1000); return () => clearInterval(t); }, []);
    return (
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'1.2rem', background:'rgba(99,102,241,0.08)', borderRadius:'12px', border:'1px solid rgba(99,102,241,0.2)' }}>
            <Loader2 size={20} className="spin" color="var(--accent)" />
            <div>
                <p style={{ margin:0, fontWeight:600, fontSize:'0.9rem' }}>{label}</p>
                <p style={{ margin:0, fontSize:'0.75rem', color:'var(--text-secondary)' }}>
                    {elapsed}s{elapsed > 10 ? ' · model loading from disk (~10s cold start)' : ' · usually 2–5s'}
                </p>
            </div>
        </div>
    );
};

// ── Session Log Modal (shown when Stop Study is clicked) ──────────────────────
const SessionLogModal = ({ elapsed, topicTitle, onSave, onDiscard }) => {
    const MOODS = ['Great','Good','Okay','Tired','Frustrated'];
    const MOOD_EMOJI = { Great:'😄', Good:'🙂', Okay:'😐', Tired:'😴', Frustrated:'😤' };
    const DIFFS = ['Easy','Medium','Hard'];

    const [notes, setNotes] = useState('');
    const [mood, setMood] = useState('Good');
    const [difficulty, setDifficulty] = useState('Medium');
    const minutes = Math.max(1, Math.round(elapsed / 60));

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDiscard}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}
        >
            <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                style={{ width:'100%', maxWidth:'520px', background:'var(--card-bg)', borderRadius:'24px', border:'1px solid var(--border)', overflow:'hidden' }}
            >
                {/* Header */}
                <div style={{ padding:'1.5rem 2rem', background:'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.25rem' }}>
                        <div style={{ background:'rgba(99,102,241,0.2)', padding:'8px', borderRadius:'10px', color:'var(--accent)' }}>
                            <Clock size={20} />
                        </div>
                        <h3 style={{ margin:0, fontSize:'1.2rem', fontWeight:700 }}>Log Study Session</h3>
                    </div>
                    <p style={{ margin:0, fontSize:'0.85rem', color:'var(--text-secondary)' }}>
                        You studied <strong style={{ color:'var(--accent)' }}>{topicTitle}</strong> for{' '}
                        <strong style={{ color:'white' }}>
                            {minutes >= 60 ? `${Math.floor(minutes/60)}h ${minutes%60}m` : `${minutes} min`}
                        </strong>
                    </p>
                </div>

                {/* Body */}
                <div style={{ padding:'1.5rem 2rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                    {/* Notes */}
                    <div>
                        <label style={{ display:'block', marginBottom:'0.5rem', fontWeight:600, fontSize:'0.9rem' }}>
                            What did you study? <span style={{ color:'var(--text-secondary)', fontWeight:400 }}>(optional)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder={`e.g. Covered ${topicTitle} — hooks, state management, useEffect patterns...`}
                            rows={3}
                            autoFocus
                            style={{ width:'100%', background:'rgba(0,0,0,0.2)', border:'1px solid var(--border)', padding:'0.8rem', borderRadius:'12px', color:'white', resize:'vertical', fontFamily:'inherit', fontSize:'0.9rem', lineHeight:1.6, boxSizing:'border-box', outline:'none' }}
                        />
                    </div>

                    {/* Mood + Difficulty row */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                        <div>
                            <label style={{ display:'block', marginBottom:'0.5rem', fontWeight:600, fontSize:'0.9rem' }}>How did it feel?</label>
                            <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                                {MOODS.map(m => (
                                    <button key={m} onClick={() => setMood(m)}
                                        style={{ padding:'0.35rem 0.7rem', borderRadius:'20px', border:`1px solid ${mood===m ? 'var(--accent)' : 'var(--border)'}`, background: mood===m ? 'rgba(99,102,241,0.2)' : 'transparent', color: mood===m ? 'var(--accent)' : 'var(--text-secondary)', cursor:'pointer', fontSize:'0.8rem', fontWeight: mood===m ? 600 : 400, transition:'all 0.15s' }}>
                                        {MOOD_EMOJI[m]} {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={{ display:'block', marginBottom:'0.5rem', fontWeight:600, fontSize:'0.9rem' }}>Difficulty</label>
                            <div style={{ display:'flex', gap:'0.4rem' }}>
                                {DIFFS.map(d => {
                                    const col = { Easy:'#10b981', Medium:'#f59e0b', Hard:'#ef4444' }[d];
                                    return (
                                        <button key={d} onClick={() => setDifficulty(d)}
                                            style={{ flex:1, padding:'0.4rem', borderRadius:'10px', border:`1px solid ${difficulty===d ? col : 'var(--border)'}`, background: difficulty===d ? `${col}20` : 'transparent', color: difficulty===d ? col : 'var(--text-secondary)', cursor:'pointer', fontSize:'0.8rem', fontWeight: difficulty===d ? 700 : 400, transition:'all 0.15s' }}>
                                            {d}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding:'1rem 2rem 1.5rem', display:'flex', gap:'0.75rem' }}>
                    <button onClick={onDiscard}
                        style={{ flex:1, padding:'0.8rem', borderRadius:'12px', background:'transparent', border:'1px solid var(--border)', color:'var(--text-secondary)', cursor:'pointer', fontWeight:600 }}>
                        Discard
                    </button>
                    <button onClick={() => onSave({ notes: notes || `Studied ${topicTitle} for ${minutes} minutes.`, mood, difficulty, duration: minutes })}
                        style={{ flex:2, padding:'0.8rem', borderRadius:'12px', background:'var(--accent)', border:'none', color:'white', cursor:'pointer', fontWeight:700, fontSize:'1rem' }}>
                        Save Session ✓
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ── Live Study Timer (shown in the topic header while studying) ───────────────
const LiveTimer = ({ seconds }) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const display = h > 0
        ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
        : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return (
        <motion.div
            initial={{ opacity:0, scale:0.9 }}
            animate={{ opacity:1, scale:1 }}
            style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.4rem 1rem', borderRadius:'20px', background:'rgba(52,211,153,0.15)', border:'1px solid rgba(52,211,153,0.3)', color:'#34d399' }}
        >
            <motion.div animate={{ opacity:[1,0.4,1] }} transition={{ repeat:Infinity, duration:1.5 }}
                style={{ width:8, height:8, borderRadius:'50%', background:'#34d399' }} />
            <span style={{ fontVariantNumeric:'tabular-nums', fontWeight:700, fontSize:'1rem', letterSpacing:'0.5px' }}>{display}</span>
        </motion.div>
    );
};

// ── Pomodoro Timer ────────────────────────────────────────────────────────────
const PomodoroTimer = ({ onSessionComplete }) => {
    const WORK = 25 * 60, BREAK = 5 * 60;
    const [seconds, setSeconds] = useState(WORK);
    const [running, setRunning] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [done, setDone] = useState(0);
    const [note, setNote] = useState(null);
    const intervalRef = useRef();
    const isBreakRef = useRef(false);
    isBreakRef.current = isBreak;

    useEffect(() => {
        if (!running) return;
        intervalRef.current = setInterval(() => {
            setSeconds(s => {
                if (s > 1) return s - 1;
                clearInterval(intervalRef.current);
                setRunning(false);
                if (!isBreakRef.current) {
                    playFocusDone();
                    onSessionComplete(25);
                    setDone(c => c + 1);
                    setNote({ msg:'🍅 Focus done! Take a 5-min break.', color:'var(--success)' });
                    setIsBreak(true);
                    setSeconds(BREAK);
                } else {
                    playBreakDone();
                    setNote({ msg:'⏰ Break over! Start next focus session.', color:'var(--accent)' });
                    setIsBreak(false);
                    setSeconds(WORK);
                }
                return 0;
            });
        }, 1000);
        return () => clearInterval(intervalRef.current);
    }, [running]);

    useEffect(() => { if (note) { const t = setTimeout(() => setNote(null), 4000); return () => clearTimeout(t); } }, [note]);

    const total = isBreak ? BREAK : WORK;
    const progress = (total - seconds) / total;
    const C = 2 * Math.PI * 54;

    return (
        <div style={{ padding:'1.5rem' }}>
            <AnimatePresence>
                {note && (
                    <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                        style={{ marginBottom:'1rem', padding:'0.8rem 1rem', borderRadius:'10px', background:`${note.color}20`, border:`1px solid ${note.color}40`, color:note.color, fontWeight:600, fontSize:'0.9rem', textAlign:'center' }}>
                        {note.msg}
                    </motion.div>
                )}
            </AnimatePresence>
            <div style={{ textAlign:'center' }}>
                <div style={{ marginBottom:'1rem', display:'flex', justifyContent:'center', gap:'0.5rem', alignItems:'center' }}>
                    <span style={{ fontSize:'0.8rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', color: isBreak ? 'var(--success)' : 'var(--accent)', padding:'3px 10px', borderRadius:'20px', background: isBreak ? 'rgba(52,211,153,0.1)' : 'rgba(99,102,241,0.1)' }}>
                        {isBreak ? '☕ Break' : '🎯 Focus'}
                    </span>
                    {done > 0 && <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{'🍅'.repeat(Math.min(done,4))} {done} done</span>}
                </div>
                <div style={{ position:'relative', width:160, height:160, margin:'0 auto 1.5rem' }}>
                    <svg width="160" height="160" style={{ transform:'rotate(-90deg)' }}>
                        <circle cx="80" cy="80" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                        <circle cx="80" cy="80" r="54" fill="none" stroke={isBreak ? 'var(--success)' : 'var(--accent)'}
                            strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-progress)}
                            style={{ transition:'stroke-dashoffset 1s linear, stroke 0.5s' }} />
                    </svg>
                    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ fontSize:'2.2rem', fontWeight:800, fontVariantNumeric:'tabular-nums', letterSpacing:'-1px' }}>{fmt(seconds)}</span>
                        <span style={{ fontSize:'0.7rem', color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'1px' }}>{isBreak ? 'break' : 'focus'}</span>
                    </div>
                </div>
                <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
                    <button onClick={() => setRunning(r => !r)}
                        style={{ background: running ? 'rgba(239,68,68,0.15)' : isBreak ? 'var(--success)' : 'var(--accent)', color: running ? '#ef4444' : 'white', border:'none', padding:'0.7rem 1.8rem', borderRadius:'12px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'1rem' }}>
                        {running ? <><StopCircle size={18}/> Pause</> : <><Play size={18}/> {seconds===total ? 'Start' : 'Resume'}</>}
                    </button>
                    <button onClick={() => { setRunning(false); clearInterval(intervalRef.current); setSeconds(WORK); setIsBreak(false); }}
                        style={{ background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'white', padding:'0.7rem', borderRadius:'12px', cursor:'pointer' }}>
                        <RotateCcw size={18}/>
                    </button>
                    <button onClick={() => playFocusDone()} title="Test sound"
                        style={{ background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'0.7rem', borderRadius:'12px', cursor:'pointer' }}>
                        <Volume2 size={18}/>
                    </button>
                </div>
                <p style={{ marginTop:'1rem', fontSize:'0.8rem', color:'var(--text-secondary)' }}>Sessions auto-log when timer hits zero.</p>
            </div>
        </div>
    );
};

// ── AI Quiz ───────────────────────────────────────────────────────────────────
const QuizMode = ({ topicId, token, onXpEarned }) => {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [currentQ, setCurrentQ] = useState(0);
    const [error, setError] = useState(null);

    const generateQuiz = async () => {
        setLoading(true); setResults(null); setAnswers({}); setCurrentQ(0); setError(null);
        try {
            const res = await fetch(`${API_URL}/api/quiz/generate`, {
                method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
                body: JSON.stringify({ topicId })
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Failed'); return; }
            if (!data.questions?.length) { setError(data.error || 'No questions. Add session notes first.'); return; }
            setQuestions(data.questions);
        } catch { setError('Could not reach AI service.'); }
        finally { setLoading(false); }
    };

    const submitQuiz = async () => {
        setSubmitting(true);
        try {
            const qs = questions.map((q,i) => ({ question:q.question, correctAnswer:q.correctAnswer, userAnswer:answers[i]||'' }));
            const res = await fetch(`${API_URL}/api/quiz/submit`, {
                method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
                body: JSON.stringify({ topicId, questions: qs })
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Grading failed'); return; }
            setResults(data);
            if (data.xpEarned > 0) onXpEarned();
        } catch { setError('Could not reach AI service.'); }
        finally { setSubmitting(false); }
    };

    if (loading) return <div style={{ padding:'2rem' }}><AILoader label="Generating quiz questions..." /></div>;

    if (results) return (
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} style={{ padding:'1.5rem' }}>
            <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
                <Trophy size={40} color="#ffd700" style={{ marginBottom:'0.5rem' }} />
                <h3 style={{ fontSize:'1.5rem', margin:0 }}>Score: {results.score}%</h3>
                <p style={{ color:'var(--accent)', fontWeight:700, margin:'0.25rem 0 0' }}>+{results.xpEarned} XP earned!</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                {results.graded?.map((q,i) => (
                    <div key={i} style={{ padding:'1rem', borderRadius:'12px', background: q.isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border:`1px solid ${q.isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.4rem' }}>
                            {q.isCorrect ? <CheckCircle size={16} color="var(--success)"/> : <XCircle size={16} color="#ef4444"/>}
                            <span style={{ fontWeight:600, fontSize:'0.9rem' }}>{q.question}</span>
                        </div>
                        <p style={{ margin:0, fontSize:'0.8rem', color:'var(--text-secondary)' }}>Your answer: {q.userAnswer||'(blank)'}</p>
                        {!q.isCorrect && <p style={{ margin:'0.25rem 0 0', fontSize:'0.8rem', color:'var(--success)' }}>Correct: {q.correctAnswer}</p>}
                        {q.feedback && <p style={{ margin:'0.25rem 0 0', fontSize:'0.8rem', color:'var(--text-secondary)', fontStyle:'italic' }}>{q.feedback}</p>}
                    </div>
                ))}
            </div>
            <button onClick={generateQuiz} style={{ marginTop:'1.5rem', width:'100%', background:'var(--accent)', color:'white', border:'none', padding:'0.8rem', borderRadius:'10px', fontWeight:600, cursor:'pointer' }}>Try Again</button>
        </motion.div>
    );

    if (error) return (
        <div style={{ padding:'2rem', textAlign:'center' }}>
            <p style={{ color:'#ef4444', marginBottom:'1rem' }}>{error}</p>
            <button onClick={generateQuiz} style={{ background:'var(--accent)', color:'white', border:'none', padding:'0.7rem 1.5rem', borderRadius:'10px', fontWeight:600, cursor:'pointer' }}>Retry</button>
        </div>
    );

    if (!questions.length) return (
        <div style={{ textAlign:'center', padding:'3rem' }}>
            <BrainCircuit size={48} color="var(--accent)" style={{ marginBottom:'1rem', opacity:0.7 }} />
            <h3 style={{ marginBottom:'0.5rem' }}>AI Tutor Quiz</h3>
            <p style={{ color:'var(--text-secondary)', marginBottom:'1.5rem', fontSize:'0.9rem' }}>Test your knowledge with AI-generated questions based on your notes.</p>
            <button onClick={generateQuiz} style={{ background:'var(--accent)', color:'white', border:'none', padding:'0.8rem 2rem', borderRadius:'10px', fontWeight:600, cursor:'pointer' }}>Generate Quiz</button>
        </div>
    );

    const q = questions[currentQ];
    return (
        <div style={{ padding:'1.5rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem', fontSize:'0.85rem', color:'var(--text-secondary)' }}>
                <span>Question {currentQ+1} of {questions.length}</span>
                <div style={{ display:'flex', gap:'4px' }}>
                    {questions.map((_,i) => <div key={i} style={{ width:20, height:4, borderRadius:2, background: i===currentQ ? 'var(--accent)' : answers[i] ? 'var(--success)' : 'rgba(255,255,255,0.1)' }} />)}
                </div>
            </div>
            <h3 style={{ fontSize:'1.1rem', marginBottom:'1rem', lineHeight:1.5 }}>{q.question}</h3>
            {q.hint && <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:'1rem', fontStyle:'italic' }}>💡 {q.hint}</p>}
            <textarea value={answers[currentQ]||''} onChange={e => setAnswers({...answers,[currentQ]:e.target.value})}
                placeholder="Type your answer..." rows={3}
                style={{ width:'100%', background:'rgba(0,0,0,0.2)', border:'1px solid var(--border)', padding:'0.8rem', borderRadius:'10px', color:'white', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:'0.8rem', marginTop:'1rem' }}>
                {currentQ > 0 && <button onClick={() => setCurrentQ(currentQ-1)} style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'white', padding:'0.7rem', borderRadius:'10px', cursor:'pointer' }}>← Back</button>}
                {currentQ < questions.length-1
                    ? <button onClick={() => setCurrentQ(currentQ+1)} style={{ flex:1, background:'var(--accent)', color:'white', border:'none', padding:'0.7rem', borderRadius:'10px', fontWeight:600, cursor:'pointer' }}>Next →</button>
                    : <button onClick={submitQuiz} disabled={submitting} style={{ flex:1, background:'var(--success)', color:'white', border:'none', padding:'0.7rem', borderRadius:'10px', fontWeight:600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                        {submitting ? <AILoader label="Grading..." /> : 'Submit Quiz'}
                    </button>}
            </div>
        </div>
    );
};

// ── Main TopicDetail ──────────────────────────────────────────────────────────
const TopicDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [topic, setTopic] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiSummary, setAiSummary] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('sessions');
    const { user, token, refreshUser } = React.useContext(AuthContext);
    const { socket } = React.useContext(SocketContext);

    // ── Study timer state ─────────────────────────────────────────────────────
    const [isStudying, setIsStudying] = useState(false);
    const [studySeconds, setStudySeconds] = useState(0);
    const [showLogModal, setShowLogModal] = useState(false);
    const studyIntervalRef = useRef(null);
    const studyStartRef = useRef(null);

    // Start / stop the live timer
    useEffect(() => {
        if (isStudying) {
            studyStartRef.current = Date.now() - studySeconds * 1000;
            studyIntervalRef.current = setInterval(() => {
                setStudySeconds(Math.floor((Date.now() - studyStartRef.current) / 1000));
            }, 1000);
        } else {
            clearInterval(studyIntervalRef.current);
        }
        return () => clearInterval(studyIntervalRef.current);
    }, [isStudying]);

    const handleStartStudy = () => {
        setStudySeconds(0);
        setIsStudying(true);
    };

    const handleStopStudy = () => {
        setIsStudying(false);
        clearInterval(studyIntervalRef.current);
        // Only show modal if studied for at least 30 seconds
        if (studySeconds >= 30) {
            setShowLogModal(true);
        } else {
            setStudySeconds(0);
        }
    };

    // Socket presence
    useEffect(() => {
        if (!isStudying || !socket || !topic?.workspaceId || !user) return;
        socket.emit('startStudy', { workspaceId:topic.workspaceId, userId:user.id||user._id, username:user.username, topicTitle:topic.title });
        return () => socket.emit('stopStudy', { workspaceId:topic.workspaceId, userId:user.id||user._id });
    }, [isStudying, topic, socket, user]);

    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        try {
            const [tRes, sRes] = await Promise.all([
                fetch(`${API_URL}/api/topics/${id}`, { headers:{'Authorization':`Bearer ${token}`} }),
                fetch(`${API_URL}/api/sessions/${id}`)
            ]);
            if (tRes.ok) setTopic(await tRes.json());
            if (sRes.ok) setSessions(await sRes.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleAddSession = useCallback(async (sessionData) => {
        const res = await fetch(`${API_URL}/api/sessions`, {
            method:'POST',
            headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
            body: JSON.stringify({ ...sessionData, topicId: id })
        });
        if (res.ok) { fetchData(); refreshUser(); }
    }, [id, token]);

    const handleSaveFromModal = async (data) => {
        setShowLogModal(false);
        await handleAddSession(data);
        setStudySeconds(0);
    };

    const handleDiscardModal = () => {
        setShowLogModal(false);
        setStudySeconds(0);
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this topic?')) return;
        await fetch(`${API_URL}/api/topics/${id}`, { method:'DELETE', headers:{'Authorization':`Bearer ${token}`} });
        navigate('/');
    };

    const handleStatusChange = async (newStatus) => {
        const res = await fetch(`${API_URL}/api/topics/${id}/status`, {
            method:'PATCH',
            headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
            body: JSON.stringify({ status: newStatus })
        });
        setTopic(await res.json());
        refreshUser();
    };

    const handleDeleteSession = async (sid) => {
        await fetch(`${API_URL}/api/sessions/${sid}`, { method:'DELETE', headers:{'Authorization':`Bearer ${token}`} });
        fetchData();
    };

    const handleImproveNotes = async (sid, notes) => {
        const res = await fetch(`${API_URL}/api/ai/improve-notes`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ notes, topic: topic.title })
        });
        return (await res.json()).improvedNotes;
    };

    const handleSaveImprovedNotes = async (sid, improved) => {
        await fetch(`${API_URL}/api/sessions/${sid}/notes`, {
            method:'PATCH', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
            body: JSON.stringify({ notes: improved })
        });
        fetchData();
    };

    const handleGenerateSummary = async () => {
        setAiLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/ai/summarize`, {
                method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
                body: JSON.stringify({ sessions, query:`Summarize my progress on ${topic.title}` })
            });
            const data = await res.json();
            setAiSummary(data.summary || data.analysis || 'No summary generated.');
        } catch (err) { console.error(err); }
        finally { setAiLoading(false); }
    };

    const handlePomodoroComplete = useCallback((minutes) => {
        handleAddSession({ duration:minutes, notes:`🍅 Pomodoro — ${minutes} min focused study.`, mood:'Great', difficulty:'Medium' });
    }, [handleAddSession]);

    if (loading) return <div style={{ padding:'2rem', textAlign:'center' }}><Loader2 size={32} className="spin" color="var(--accent)"/></div>;
    if (!topic) return <div style={{ padding:'2rem', textAlign:'center' }}>Topic not found</div>;

    const tabs = [
        { id:'sessions', label:'Sessions' },
        { id:'pomodoro', label:'🍅 Pomodoro' },
        { id:'quiz', label:'🧠 AI Quiz' },
        { id:'summary', label:'AI Summary' }
    ];

    return (
        <div>
            {/* Session log modal */}
            <AnimatePresence>
                {showLogModal && (
                    <SessionLogModal
                        elapsed={studySeconds}
                        topicTitle={topic.title}
                        onSave={handleSaveFromModal}
                        onDiscard={handleDiscardModal}
                    />
                )}
            </AnimatePresence>

            <button onClick={() => navigate('/')} style={{ background:'none', border:'none', color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem', cursor:'pointer' }}>
                <ArrowLeft size={20}/> Back to Dashboard
            </button>

            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                style={{ background:'var(--card-bg)', padding:'2rem', borderRadius:'16px', border:'1px solid var(--border)', marginBottom:'2rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>
                    <div>
                        <span style={{ color:'var(--accent)', letterSpacing:'1px', textTransform:'uppercase', fontSize:'0.8rem' }}>{topic.category}</span>
                        <h1 style={{ fontSize:'2.5rem', margin:'0.5rem 0' }}>{topic.title}</h1>
                        {topic.goal && <p style={{ color:'var(--text-secondary)', fontSize:'1.1rem', margin:0 }}>Goal: {topic.goal}</p>}
                        <div style={{ display:'flex', gap:'1rem', marginTop:'0.5rem', fontSize:'0.85rem', color:'var(--text-secondary)', flexWrap:'wrap', alignItems:'center' }}>
                            {topic.totalStudyMinutes > 0 && <span>⏱ {Math.floor(topic.totalStudyMinutes/60)}h {topic.totalStudyMinutes%60}m studied</span>}
                            {topic.difficulty && <span>📊 {topic.difficulty}</span>}
                            {topic.nextReviewDate && <span>🔄 Review: {new Date(topic.nextReviewDate).toLocaleDateString()}</span>}
                            {/* Live timer shown inline when studying */}
                            {isStudying && <LiveTimer seconds={studySeconds} />}
                        </div>
                    </div>
                    <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
                        <select value={topic.status} onChange={e => handleStatusChange(e.target.value)}
                            style={{ background:'var(--bg-color)', color:'white', border:'1px solid var(--border)', padding:'0.5rem 1rem', borderRadius:'8px' }}>
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Revised">Revised</option>
                        </select>

                        {/* Study Now / Stop Study button */}
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={isStudying ? handleStopStudy : handleStartStudy}
                            style={{ background: isStudying ? 'var(--danger)' : 'var(--success)', color:'white', border:'none', padding:'0.6rem 1.5rem', borderRadius:'8px', display:'flex', alignItems:'center', gap:'0.6rem', fontWeight:700, cursor:'pointer', minWidth:'140px', justifyContent:'center' }}>
                            {isStudying
                                ? <><StopCircle size={18}/> Stop Study</>
                                : <><Play size={18}/> Study Now</>}
                        </motion.button>

                        <button onClick={handleDelete} style={{ background:'rgba(239,68,68,0.1)', color:'var(--danger)', border:'none', padding:'0.5rem', borderRadius:'8px', cursor:'pointer' }}>
                            <Trash2 size={20}/>
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', background:'rgba(255,255,255,0.03)', padding:'0.4rem', borderRadius:'14px', width:'fit-content', flexWrap:'wrap' }}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        style={{ background: activeTab===tab.id ? 'var(--accent)' : 'transparent', border:'none', color:'white', padding:'0.5rem 1.2rem', borderRadius:'10px', cursor:'pointer', fontWeight: activeTab===tab.id ? 600 : 400, transition:'0.2s', fontSize:'0.9rem' }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'sessions' && (
                    <motion.div key="sessions" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                        <SessionLog sessions={sessions} onAddSession={handleAddSession} onDeleteSession={handleDeleteSession} onImproveNotes={handleImproveNotes} onSaveImprovedNotes={handleSaveImprovedNotes} />
                    </motion.div>
                )}
                {activeTab === 'pomodoro' && (
                    <motion.div key="pomodoro" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                        <div style={{ background:'var(--card-bg)', borderRadius:'16px', border:'1px solid var(--border)', maxWidth:'420px' }}>
                            <div style={{ padding:'1.5rem 1.5rem 0', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                                <Timer size={20} color="var(--accent)"/>
                                <h3 style={{ margin:0 }}>Pomodoro Timer</h3>
                            </div>
                            <PomodoroTimer onSessionComplete={handlePomodoroComplete} />
                        </div>
                    </motion.div>
                )}
                {activeTab === 'quiz' && (
                    <motion.div key="quiz" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                        <div style={{ background:'var(--card-bg)', borderRadius:'16px', border:'1px solid var(--border)', maxWidth:'600px' }}>
                            <QuizMode topicId={id} token={token} onXpEarned={() => refreshUser()} />
                        </div>
                    </motion.div>
                )}
                {activeTab === 'summary' && (
                    <motion.div key="summary" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                        <div style={{ background:'var(--card-bg)', padding:'2rem', borderRadius:'16px', border:'1px solid var(--border)' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                                <h3 style={{ fontSize:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem', margin:0 }}>
                                    <BrainCircuit size={20} color="var(--accent)"/> AI Progress Summary
                                </h3>
                                <button onClick={handleGenerateSummary} disabled={aiLoading}
                                    style={{ background:'var(--accent)', color:'white', border:'none', padding:'0.5rem 1rem', borderRadius:'6px', opacity: aiLoading ? 0.7 : 1, cursor: aiLoading ? 'not-allowed' : 'pointer' }}>
                                    {aiLoading ? 'Generating...' : 'Generate Summary'}
                                </button>
                            </div>
                            {aiLoading && <AILoader label="Analyzing your progress..." />}
                            {!aiLoading && aiSummary && (
                                <motion.div initial={{opacity:0}} animate={{opacity:1}}
                                    style={{ background:'rgba(16,185,129,0.1)', padding:'1rem', borderRadius:'8px', borderLeft:'4px solid var(--success)', lineHeight:1.7 }}>
                                    {aiSummary}
                                </motion.div>
                            )}
                            {!aiLoading && !aiSummary && (
                                <p style={{ color:'var(--text-secondary)', textAlign:'center', padding:'2rem' }}>
                                    Click "Generate Summary" to get an AI analysis of your progress on this topic.
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TopicDetail;
