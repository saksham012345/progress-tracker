import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            overflow: 'hidden',
            pointerEvents: 'none',
            background: 'var(--bg-color)'
        }}>
            {/* Noise Texture */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0.03, // Subtle grain
                zIndex: 2,
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
            }} />

            {/* Aurora Blobs */}
            <motion.div
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-10%',
                    width: '50vw',
                    height: '50vw',
                    background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
                    opacity: 0.15,
                    filter: 'blur(80px)',
                    zIndex: 1
                }}
            />

            <motion.div
                animate={{
                    x: [0, -150, 0],
                    y: [0, 100, 0],
                    scale: [1, 1.3, 1]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                style={{
                    position: 'absolute',
                    top: '20%',
                    right: '-5%',
                    width: '40vw',
                    height: '40vw',
                    background: 'radial-gradient(circle, var(--success) 0%, transparent 70%)',
                    opacity: 0.1,
                    filter: 'blur(100px)',
                    zIndex: 1
                }}
            />

            <motion.div
                animate={{
                    x: [0, 50, 0],
                    y: [0, -50, 0],
                    rotate: [0, 360]
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{
                    position: 'absolute',
                    bottom: '-10%',
                    left: '30%',
                    width: '60vw',
                    height: '60vw',
                    background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
                    opacity: 0.1,
                    filter: 'blur(120px)',
                    zIndex: 1
                }}
            />
        </div>
    );
};

export default AnimatedBackground;
