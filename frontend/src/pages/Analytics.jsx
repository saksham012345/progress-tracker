import React, { useState, useEffect, useContext, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../config';
import { AuthContext } from '../context/AuthContext';
import { Loader2, TrendingUp, Clock, Target, Zap, FileText, RefreshCw } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatCard = ({ icon, label, value, sub, color }) => (
    <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: `${color}20`, color }}>{icon}</div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
        </div>
        <p style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{value}</p>
        {sub && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>{sub}</p>}
    </div>
);

const Analytics = () => {
    const { token, user } = useContext(AuthContext);
    const [sessions, setSessions] = useState([]);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('week'); // week | month | all
    const [weeklyReport, setWeeklyReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [sRes, tRes] = await Promise.all([
                fetch(`${API_URL}/api/sessions`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/topics`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            setSessions(await sRes.json());
            setTopics(await tRes.json());
        } catch (err) { console.error('Failed to fetch analytics:', err); }
        finally { setLoading(false); }
    };

    const fetchWeeklyReport = async () => {
        setReportLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/ai/weekly-report`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setWeeklyReport(data);
        } catch (err) { console.error(err); }
        finally { setReportLoading(false); }
    };

    const filtered = useMemo(() => {
        const now = new Date();
        if (range === 'week') {
            const cutoff = new Date(); cutoff.setDate(now.getDate() - 7);
            return sessions.filter(s => new Date(s.date) >= cutoff);
        }
        if (range === 'month') {
            const cutoff = new Date(); cutoff.setDate(now.getDate() - 30);
            return sessions.filter(s => new Date(s.date) >= cutoff);
        }
        return sessions;
    }, [sessions, range]);

    // Weekly activity (hours by day of week)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activityData = Array(7).fill(0).map((_, i) => ({ name: days[i], hours: 0 }));
    filtered.forEach(s => {
        const d = new Date(s.date).getDay();
        activityData[d].hours = Math.round((activityData[d].hours + s.duration / 60) * 10) / 10;
    });

    // Topic distribution
    const topicMap = {};
    filtered.forEach(s => {
        const name = s.topicId?.title || 'Unknown';
        topicMap[name] = (topicMap[name] || 0) + s.duration;
    });
    const topicDistribution = Object.entries(topicMap).map(([name, value]) => ({ name, value }));

    // Daily trend (last 14 days) — uses all sessions regardless of range filter
    const trendData = useMemo(() => {
        const data = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
            const mins = sessions
                .filter(s => new Date(s.date).toDateString() === d.toDateString())
                .reduce((sum, s) => sum + s.duration, 0);
            data.push({ date: label, minutes: mins });
        }
        return data;
    }, [sessions]);

    // Stats
    const totalMins = filtered.reduce((sum, s) => sum + s.duration, 0);
    const avgSession = filtered.length ? Math.round(totalMins / filtered.length) : 0;
    const revisedCount = topics.filter(t => t.status === 'Revised').length;
    const moodCounts = filtered.reduce((acc, s) => { if (s.mood) acc[s.mood] = (acc[s.mood] || 0) + 1; return acc; }, {});
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><Loader2 size={40} className="spin" color="var(--accent)" /></div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '2rem', margin: 0 }}>Learning Analytics</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['week', 'month', 'all'].map(r => (
                        <button key={r} onClick={() => setRange(r)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: range === r ? 'var(--accent)' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: range === r ? 600 : 400, textTransform: 'capitalize' }}>
                            {r === 'all' ? 'All Time' : `Last ${r === 'week' ? '7 days' : '30 days'}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard icon={<Clock size={18} />} label="Total Study Time" value={`${Math.floor(totalMins / 60)}h ${totalMins % 60}m`} sub={`${filtered.length} sessions`} color="#3b82f6" />
                <StatCard icon={<TrendingUp size={18} />} label="Avg Session" value={`${avgSession}m`} sub="per session" color="#10b981" />
                <StatCard icon={<Target size={18} />} label="Topics Revised" value={revisedCount} sub={`of ${topics.length} total`} color="#f59e0b" />
                <StatCard icon={<Zap size={18} />} label="XP Earned" value={user?.points || 0} sub={`Level ${user?.level || 1}`} color="#8b5cf6" />
                <StatCard icon={<span style={{ fontSize: '1rem' }}>😊</span>} label="Top Mood" value={topMood} sub="most common" color="#ec4899" />
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', minWidth: 0 }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Weekly Activity (Hours)</h3>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={activityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border)' }} itemStyle={{ color: 'var(--text-primary)' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="hours" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', minWidth: 0 }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Topic Distribution (Minutes)</h3>
                    <div style={{ width: '100%', height: 250 }}>
                        {topicDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={topicDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                                        {topicDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                                    <Legend formatter={v => <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: '4rem' }}>No data for this period.</p>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* 14-day trend */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '2rem', minWidth: 0 }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>14-Day Study Trend (Minutes)</h3>
                <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                            <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} interval={1} />
                            <YAxis stroke="var(--text-secondary)" fontSize={11} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                            <Line type="monotone" dataKey="minutes" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} activeDot={{ r: 5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* AI Weekly Report */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={20} color="var(--accent)" /> AI Weekly Report
                    </h3>
                    <button onClick={fetchWeeklyReport} disabled={reportLoading} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: reportLoading ? 0.7 : 1 }}>
                        {reportLoading ? <><Loader2 size={16} className="spin" /> Generating...</> : <><RefreshCw size={16} /> Generate Report</>}
                    </button>
                </div>
                <AnimatePresence>
                    {weeklyReport && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                {[
                                    { label: 'Study Time', value: `${Math.floor((weeklyReport.stats?.totalMinutes || 0) / 60)}h ${(weeklyReport.stats?.totalMinutes || 0) % 60}m` },
                                    { label: 'Sessions', value: weeklyReport.stats?.sessionCount || 0 },
                                    { label: 'Streak', value: `${weeklyReport.stats?.streak || 0} days` },
                                    { label: 'Due Reviews', value: weeklyReport.stats?.dueReviews || 0 }
                                ].map(s => (
                                    <div key={s.label} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{s.value}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.label}</p>
                                    </div>
                                ))}
                            </div>
                            <div style={{ background: 'rgba(99,102,241,0.08)', padding: '1.2rem', borderRadius: '10px', borderLeft: '3px solid var(--accent)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                                {weeklyReport.report}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {!weeklyReport && !reportLoading && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Get a personalized AI analysis of your week — what you studied, what to focus on next, and a motivational insight.</p>
                )}
            </motion.div>
        </div>
    );
};

export default Analytics;
