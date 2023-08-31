// Write your tests here
const request = require('supertest')
const server = require('./server')
const db = require('../data/dbConfig')

beforeAll(async () => {
  await db.migrate.rollback()
  await db.migrate.latest()
})
afterAll(async () => {
  await db.destroy()
})

test('sanity', () => {
  expect(true).toBe(true)
})

describe('[POST] /api/auth/register', () => {
  it('[1] adds a new user to the database with status 401', async () => {
    await request(server).post('/api/auth/register').send({
      username: 'bob123',
      password: 'foobar'
    })
    const bob = await db('users').where('username', 'bob123').first()
    expect(bob).toMatchObject({ username: 'bob123' })
  })
  it('[2] rejects registration if username or password is missing', async () => {
    const res = await request(server).post('/api/auth/register').send({
      username: '',
      password: 'foobar'
    })
    expect(res.status).toBe(422)
    expect(res.body.message).toMatch(/username and password required/i)
  })
})

describe('[POST] /api/auth/login', () => {
  it('[3] responds with correct message on invalid credentials', async () => {
    const res = await request(server).post('/api/auth/login').send({
      username: 'bob',
      password: 'foobar'
    })
    expect(res.status).toBe(401)
    expect(res.body.message).toMatch(/invalid credentials/i)
  })
  it('[4] responds with correct message on valid credentials', async () => {
    await request(server).post('/api/auth/register').send({
      username: 'bob',
      password: '1234'
    })
    const res = await request(server).post('/api/auth/login').send({
      username: 'bob',
      password: '1234'
    })
    expect(res.body.message).toMatch(/welcome, bob/i)
    expect(res.body.token).toBeTruthy()
  })
})

describe('[GET] /api/jokes', () => {
  it('[5] responds with correct message on invalid token', async () => {
    const res = await request(server).get('/api/jokes')
    expect(res.status).toBe(401)
    expect(res.body.message).toMatch(/token required/i)
  })
  it('[6] returns a list of jokes on authorized request', async () => {
    await request(server).post('/api/auth/register').send({
      username: 'bob',
      password: '1234'
    })
    let res = await request(server).post('/api/auth/login').send({
      username: 'bob',
      password: '1234'
    })
    res = await request(server).get('/api/jokes').set('Authorization', res.body.token)
    expect(res.body).toMatchObject([
      {
        "id": "0189hNRf2g",
        "joke": "I'm tired of following my dreams. I'm just going to ask them where they are going and meet up with them later."
      },
      {
        "id": "08EQZ8EQukb",
        "joke": "Did you hear about the guy whose whole left side was cut off? He's all right now."
      },
      {
        "id": "08xHQCdx5Ed",
        "joke": "Why didn’t the skeleton cross the road? Because he had no guts."
      },
    ])
  })
})
