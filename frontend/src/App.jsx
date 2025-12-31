import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TopicDetail from './pages/TopicDetail';
import Resources from './pages/Resources';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import StudyPlanner from './pages/StudyPlanner';
import './index.css';

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/planner" element={<StudyPlanner />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/topic/:id" element={<TopicDetail />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
