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
