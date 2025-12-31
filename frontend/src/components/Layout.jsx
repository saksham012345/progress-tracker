import React from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import ChatWidget from './ChatWidget';

const Layout = ({ children }) => {
    return (
        <div className="layout-root" style={{ minHeight: '100vh', display: 'flex' }}>
            <Sidebar />

            <motion.main
                style={{
                    flex: 1,
                    marginLeft: '250px', // Offset for sidebar
                    padding: '2rem',
                    width: 'calc(100% - 250px)'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {children}
                </div>
            </motion.main>

            <ChatWidget />
        </div>
    );
};

export default Layout;
