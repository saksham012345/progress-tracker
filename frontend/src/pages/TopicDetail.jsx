import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, BrainCircuit } from 'lucide-react';
import SessionLog from '../components/SessionLog';
import { API_URL } from '../config';

const TopicDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [topic, setTopic] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiSummary, setAiSummary] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const topicRes = await fetch(`${API_URL}/api/topics`); // Filter locally for now or better endpoint
            // Wait, I should have a single topic endpoint ideally, but I didn't create it. 
            // I'll filter from list or add endpoint. 
            // Actually, I can just fetch all and filter finding the one. Not efficient but works for MVP.
            const allTopics = await topicRes.json();
            const foundTopic = allTopics.find(t => t._id === id);
            setTopic(foundTopic);

            setTopic(foundTopic);

            const sessionsRes = await fetch(`${API_URL}/api/sessions/${id}`);
            const sessionsData = await sessionsRes.json();
            setSessions(sessionsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this topic?')) return;
        try {
            await fetch(`${API_URL}/api/topics/${id}`, { method: 'DELETE' });
            navigate('/');
        } catch (err) {
            console.error(err);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const res = await fetch(`${API_URL}/api/topics/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const updatedTopic = await res.json();
            setTopic(updatedTopic);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddSession = async (sessionData) => {
        try {
            const res = await fetch(`${API_URL}/api/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...sessionData, topicId: id })
            });
            if (res.ok) {
                fetchData(); // Refresh list
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerateSummary = async () => {
        setAiLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/ai/summarize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessions })
            });
            const data = await res.json();
            setAiSummary(data.summary);
        } catch (err) {
            console.error(err);
        } finally {
            setAiLoading(false);
        }
    };

    const handleImproveNotes = async (notes) => {
        // Implement modal or inline replacement. For MVP, alert or simple state.
        // Let's us a simple alert for now or set a temporary state to show improved notes.
        const res = await fetch(`${API_URL}/api/ai/improve-notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes, topic: topic.title })
        });
        const data = await res.json();
        alert(`Improved Notes:\n\n${data.improvedNotes}`);
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    if (!topic) return <div style={{ padding: '2rem', textAlign: 'center' }}>Topic not found</div>;

    return (
        <div>
            <button
                onClick={() => navigate('/')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
            >
                <ArrowLeft size={20} /> Back to Dashboard
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'var(--card-bg)',
                    padding: '2rem',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    marginBottom: '2rem'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <span style={{ color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8rem' }}>{topic.category}</span>
                        <h1 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{topic.title}</h1>
                        {topic.goal && <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Goal: {topic.goal}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <select
                            value={topic.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            style={{
                                background: 'var(--bg-color)',
                                color: 'white',
                                border: '1px solid var(--border)',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px'
                            }}
                        >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Revised">Revised</option>
                        </select>
                        <button
                            onClick={handleDelete}
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', padding: '0.5rem', borderRadius: '8px' }}
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BrainCircuit size={20} color="var(--accent)" /> AI Progress Summary
                        </h3>
                        <button
                            onClick={handleGenerateSummary}
                            disabled={aiLoading}
                            style={{
                                background: 'var(--accent)',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                opacity: aiLoading ? 0.7 : 1
                            }}
                        >
                            {aiLoading ? 'Generating...' : 'Generate Summary'}
                        </button>
                    </div>
                    {aiSummary && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px', color: 'var(--text-primary)', borderLeft: '4px solid var(--success)' }}
                        >
                            {aiSummary}
                        </motion.div>
                    )}
                </div>
            </motion.div>

            <SessionLog
                sessions={sessions}
                onAddSession={handleAddSession}
                onImproveNotes={handleImproveNotes}
            />
        </div>
    );
};

export default TopicDetail;
