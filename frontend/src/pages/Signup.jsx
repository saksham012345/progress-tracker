import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Loader2, ArrowRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Signup = () => {
    const { signup } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signup(formData.username, formData.email, formData.password);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'var(--card-bg)',
                    padding: '3rem',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '450px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'var(--success)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        transform: 'rotate(5deg)'
                    }}>
                        <UserPlus size={30} color="white" />
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Account</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Start your learning journey today</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                        padding: '1rem',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Username</label>
                        <input
                            type="text"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-color)',
                                color: 'white',
                                fontSize: '1rem'
                            }}
                            placeholder="johndoe"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-color)',
                                color: 'white',
                                fontSize: '1rem'
                            }}
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-color)',
                                color: 'white',
                                fontSize: '1rem'
                            }}
                            placeholder="Create a strong password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: 'var(--success)',
                            color: 'white',
                            border: 'none',
                            padding: '1rem',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {loading ? <Loader2 className="spin" size={20} /> : <>Sign Up <ArrowRight size={20} /></>}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--success)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
