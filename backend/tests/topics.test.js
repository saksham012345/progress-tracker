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
let userId;

beforeEach(async () => {
    const res = await request(app).post('/api/auth/signup').send({
        username: 'topicuser', email: 'topic@test.com', password: 'password123'
    });
    token = res.body.token;
    userId = res.body.user.id;
});

describe('Topic Routes', () => {
    test('POST /api/topics — creates a topic', async () => {
        const res = await request(app)
            .post('/api/topics')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'React Hooks', category: 'Frontend', goal: 'Master hooks', difficulty: 'Medium' });
        expect(res.status).toBe(201);
        expect(res.body.title).toBe('React Hooks');
        expect(res.body.difficulty).toBe('Medium');
    });

    test('GET /api/topics — returns only user topics', async () => {
        await request(app).post('/api/topics').set('Authorization', `Bearer ${token}`).send({ title: 'Topic A', category: 'Cat' });

        // Create second user
        const res2 = await request(app).post('/api/auth/signup').send({ username: 'other', email: 'other@test.com', password: 'password123' });
        await request(app).post('/api/topics').set('Authorization', `Bearer ${res2.body.token}`).send({ title: 'Topic B', category: 'Cat' });

        const res = await request(app).get('/api/topics').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].title).toBe('Topic A');
    });

    test('PUT /api/topics/:id — updates topic fields', async () => {
        const create = await request(app).post('/api/topics').set('Authorization', `Bearer ${token}`).send({ title: 'Old Title', category: 'Cat' });
        const id = create.body._id;

        const res = await request(app).put(`/api/topics/${id}`).set('Authorization', `Bearer ${token}`).send({ title: 'New Title', category: 'Cat', difficulty: 'Hard' });
        expect(res.status).toBe(200);
        expect(res.body.title).toBe('New Title');
        expect(res.body.difficulty).toBe('Hard');
    });

    test('PATCH /api/topics/:id/status — awards 50 XP on Revised', async () => {
        const create = await request(app).post('/api/topics').set('Authorization', `Bearer ${token}`).send({ title: 'Test Topic', category: 'Cat' });
        const id = create.body._id;

        await request(app).patch(`/api/topics/${id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Revised' });

        const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        expect(me.body.points).toBeGreaterThanOrEqual(50);
    });

    test('PATCH /api/topics/:id/status — schedules spaced repetition on Revised', async () => {
        const create = await request(app).post('/api/topics').set('Authorization', `Bearer ${token}`).send({ title: 'SR Topic', category: 'Cat' });
        const id = create.body._id;

        const res = await request(app).patch(`/api/topics/${id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Revised' });
        expect(res.body.nextReviewDate).toBeTruthy();
    });

    test('DELETE /api/topics/:id — removes topic', async () => {
        const create = await request(app).post('/api/topics').set('Authorization', `Bearer ${token}`).send({ title: 'Delete Me', category: 'Cat' });
        const id = create.body._id;

        const del = await request(app).delete(`/api/topics/${id}`).set('Authorization', `Bearer ${token}`);
        expect(del.status).toBe(200);

        const list = await request(app).get('/api/topics').set('Authorization', `Bearer ${token}`);
        expect(list.body.length).toBe(0);
    });

    test('GET /api/topics/due-review — returns topics due for review', async () => {
        const res = await request(app).get('/api/topics/due-review').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
