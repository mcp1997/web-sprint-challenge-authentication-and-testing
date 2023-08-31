const router = require('express').Router();
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../secrets')
const db = require('../../data/dbConfig')
const Users = require('./auth-model');

router.post('/register', async (req, res) => {
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.
    DO NOT EXCEED 2^8 ROUNDS OF HASHING!

    1- In order to register a new account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel", // must not exist already in the `users` table
        "password": "foobar"          // needs to be hashed before it's saved
      }

    2- On SUCCESSFUL registration,
      the response body should have `id`, `username` and `password`:
      {
        "id": 1,
        "username": "Captain Marvel",
        "password": "2a$08$jG.wIGR2S4hxuyWNcBf9MuoC4y0dNy7qC/LbmtuFBSdIhWks2LhpG"
      }

    3- On FAILED registration due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED registration due to the `username` being taken,
      the response body should include a string exactly as follows: "username taken".
  */
  const { username, password } = req.body
  const existing = await db('users').where({ username }).first()
  if(!username || !password) {
    res.status(422).json({
      message: 'username and password required'
    })
  } else if(!username.trim() || !password.trim()) {
    res.status(422).json({
      message: 'username and password required'
    })
  } else if(existing) {
    res.status(422).json({
      message: 'username taken'
    })
  } else {
    const hash = bcrypt.hashSync(password, 8)
    Users.insert({ username, password: hash })
      .then(created => {
        res.status(201).json(created)
      })
      .catch(err => {
        res.status(500).json({
          message: err.message,
          stack: err.stack
        })
      })
  }
});

const buildToken = user => {
  console.log(JWT_SECRET)
  const payload = {
    subject: user.id,
    username: user.username
  }
  const options = {
    expiresIn: '1d',
  }
  return jwt.sign(payload, JWT_SECRET, options)
}

router.post('/login', async (req, res) => {
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.

    1- In order to log into an existing account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel",
        "password": "foobar"
      }

    2- On SUCCESSFUL login,
      the response body should have `message` and `token`:
      {
        "message": "welcome, Captain Marvel",
        "token": "eyJhbGciOiJIUzI ... ETC ... vUPjZYDSa46Nwz8"
      }

    3- On FAILED login due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED login due to `username` not existing in the db, or `password` being incorrect,
      the response body should include a string exactly as follows: "invalid credentials".
  */
  const { username, password } = req.body
  const user = await db('users').where({ username }).first()
  if(!username || !password) {
    res.status(422).json({
      message: 'username and password required'
    })
  } else if(!user || !(bcrypt.compareSync(password, user.password))) {
    res.status(401).json({
      message: 'invalid credentials'
    })
  } else {
    const token = buildToken(user)
    res.json({
      message: `welcome, ${user.username}`,
      token
    })
  }
});

module.exports = router;
