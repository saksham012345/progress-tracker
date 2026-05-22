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
let topicId;

beforeEach(async () => {
    const signup = await request(app).post('/api/auth/signup').send({
        username: 'sessionuser', email: 'session@test.com', password: 'password123'
    });
    token = signup.body.token;

    const topic = await request(app).post('/api/topics').set('Authorization', `Bearer ${token}`).send({ title: 'JS Basics', category: 'Programming' });
    topicId = topic.body._id;
});

describe('Session Routes', () => {
    test('POST /api/sessions — creates a session', async () => {
        const res = await request(app)
            .post('/api/sessions')
            .set('Authorization', `Bearer ${token}`)
            .send({ topicId, duration: 30, notes: 'Studied closures', mood: 'Good', difficulty: 'Medium' });
        expect(res.status).toBe(201);
        expect(res.body.duration).toBe(30);
        expect(res.body.mood).toBe('Good');
    });

    test('POST /api/sessions — awards XP for session', async () => {
        await request(app).post('/api/sessions').set('Authorization', `Bearer ${token}`).send({ topicId, duration: 45, notes: 'Deep work session' });
        const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        // Should have login XP + session XP
        expect(me.body.points).toBeGreaterThan(10);
    });

    test('POST /api/sessions — updates topic totalStudyMinutes', async () => {
        await request(app).post('/api/sessions').set('Authorization', `Bearer ${token}`).send({ topicId, duration: 60, notes: 'Long session' });
        const topics = await request(app).get('/api/topics').set('Authorization', `Bearer ${token}`);
        expect(topics.body[0].totalStudyMinutes).toBe(60);
    });

    test('GET /api/sessions/:topicId — returns sessions for topic', async () => {
        await request(app).post('/api/sessions').set('Authorization', `Bearer ${token}`).send({ topicId, duration: 20, notes: 'Quick review' });
        const res = await request(app).get(`/api/sessions/${topicId}`);
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
    });

    test('DELETE /api/sessions/:id — removes session and decrements study time', async () => {
        const create = await request(app).post('/api/sessions').set('Authorization', `Bearer ${token}`).send({ topicId, duration: 30, notes: 'To delete' });
        const sessionId = create.body._id;

        await request(app).delete(`/api/sessions/${sessionId}`).set('Authorization', `Bearer ${token}`);

        const topics = await request(app).get('/api/topics').set('Authorization', `Bearer ${token}`);
        expect(topics.body[0].totalStudyMinutes).toBe(0);
    });

    test('POST /api/sessions — validates required fields', async () => {
        const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${token}`).send({ topicId, duration: 0 }); // missing notes, invalid duration
        expect(res.status).toBe(400);
    });
});
