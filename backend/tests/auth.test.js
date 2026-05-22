require('./setup');
const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
    const user = { username: 'testuser', email: 'test@example.com', password: 'password123' };

    test('POST /api/auth/signup — creates a new user', async () => {
        const res = await request(app).post('/api/auth/signup').send(user);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.username).toBe('testuser');
    });

    test('POST /api/auth/signup — rejects duplicate email', async () => {
        await request(app).post('/api/auth/signup').send(user);
        const res = await request(app).post('/api/auth/signup').send(user);
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/already exists/i);
    });

    test('POST /api/auth/login — returns token on valid credentials', async () => {
        await request(app).post('/api/auth/signup').send(user);
        const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('streak');
        expect(res.body.user).toHaveProperty('points');
    });

    test('POST /api/auth/login — rejects wrong password', async () => {
        await request(app).post('/api/auth/signup').send(user);
        const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrongpass' });
        expect(res.status).toBe(400);
    });

    test('POST /api/auth/login — awards 10 XP on login', async () => {
        await request(app).post('/api/auth/signup').send(user);
        const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
        expect(res.body.user.points).toBeGreaterThanOrEqual(10);
    });

    test('GET /api/auth/me — returns user profile with token', async () => {
        const signup = await request(app).post('/api/auth/signup').send(user);
        const token = signup.body.token;
        const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.username).toBe('testuser');
    });

    test('GET /api/auth/me — rejects without token', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });
});
