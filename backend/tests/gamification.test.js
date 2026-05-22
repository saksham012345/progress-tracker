require('./setup');
const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const apiRoutes = require('../routes/api');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

let token;

beforeEach(async () => {
    const signup = await request(app).post('/api/auth/signup').send({
        username: 'gamifyuser', email: 'gamify@test.com', password: 'password123'
    });
    token = signup.body.token;
});

describe('Gamification', () => {
    test('Login awards 10 XP and sets streak to 1', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'gamify@test.com', password: 'password123' });
        expect(res.body.user.points).toBeGreaterThanOrEqual(10);
        expect(res.body.user.streak).toBe(1);
    });

    test('Completing subtasks awards 5 XP each', async () => {
        const topic = await request(app).post('/api/topics').set('Authorization', `Bearer ${token}`).send({ title: 'Subtask Topic', category: 'Test' });
        const id = topic.body._id;

        // Set subtasks
        await request(app).patch(`/api/topics/${id}/status`).set('Authorization', `Bearer ${token}`).send({
            subTasks: [{ title: 'Task 1', completed: false }, { title: 'Task 2', completed: false }]
        });

        const before = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        const pointsBefore = before.body.points;

        // Complete one subtask
        await request(app).patch(`/api/topics/${id}/status`).set('Authorization', `Bearer ${token}`).send({
            subTasks: [{ title: 'Task 1', completed: true }, { title: 'Task 2', completed: false }]
        });

        const after = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        expect(after.body.points).toBe(pointsBefore + 5);
    });

    test('Revising a topic awards 50 XP and a badge', async () => {
        const topic = await request(app).post('/api/topics').set('Authorization', `Bearer ${token}`).send({ title: 'Badge Topic', category: 'Test' });
        const id = topic.body._id;

        const before = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        const pointsBefore = before.body.points;

        await request(app).patch(`/api/topics/${id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Revised' });

        const after = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        expect(after.body.points).toBe(pointsBefore + 50);
        expect(after.body.badges.some(b => b.name === 'First Revision')).toBe(true);
    });

    test('Level increases every 200 XP', async () => {
        const User = require('../models/User');
        const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        await User.findByIdAndUpdate(me.body._id, { points: 200 });
        // Trigger level recalc via login
        const login = await request(app).post('/api/auth/login').send({ email: 'gamify@test.com', password: 'password123' });
        expect(login.body.user.level).toBeGreaterThanOrEqual(2);
    });
});
