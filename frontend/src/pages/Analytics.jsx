import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { API_URL } from '../config';

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
            const res = await fetch(`${API_URL}/api/sessions`);
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
    // ... (lines 32-106 unchanged) ...
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}
    >
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Topic Distribution (Minutes)</h3>
        <div style={{ height: '300px', minHeight: '300px' }}>
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
            </div >
        </div >
    );
};

export default Analytics;
