import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const Analytics = () => {
    const [activityData, setActivityData] = useState([]);
    const [topicDistribution, setTopicDistribution] = useState([]);
    const [loading, setLoading] = useState(true);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/sessions');
            const sessions = await res.json();

            // Process data for charts
            processActivityData(sessions);
            processTopicDistribution(sessions);
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
        } finally {
            setLoading(false);
        }
    };

    const processActivityData = (sessions) => {
        // Group by day of week (0-6)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const activity = Array(7).fill(0).map((_, i) => ({ name: days[i], hours: 0 }));

        sessions.forEach(session => {
            const date = new Date(session.date);
            const dayIndex = date.getDay();
            // Convert measurement (minutes) to hours roughly
            activity[dayIndex].hours += (session.duration / 60);
        });

        // Round to 1 decimal
        activity.forEach(d => d.hours = Math.round(d.hours * 10) / 10);
        setActivityData(activity);
    };

    const processTopicDistribution = (sessions) => {
        const topicMap = {};

        sessions.forEach(session => {
            // Need populated topicId or just handle if strings
            // sessionController.getAllSessions uses .populate('topicId')
            const topicName = session.topicId?.title || 'Unknown Topic';

            if (!topicMap[topicName]) {
                topicMap[topicName] = 0;
            }
            topicMap[topicName] += session.duration;
        });

        const distribution = Object.keys(topicMap).map(key => ({
            name: key,
            value: topicMap[key]
        }));

        setTopicDistribution(distribution);
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading analytics...</div>;

    return (
        <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Learning Analytics</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}
                >
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Weekly Activity (Hours)</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                                <YAxis stroke="var(--text-secondary)" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border)' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="hours" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}
                >
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Topic Distribution (Minutes)</h3>
                    <div style={{ height: '300px' }}>
                        {topicDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={topicDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {topicDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border)' }}
                                        itemStyle={{ color: 'var(--text-primary)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: '4rem' }}>No data available yet.</p>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Analytics;
