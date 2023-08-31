const db = require('../../data/dbConfig')

const insert = async newUser => {
  const [id] = await db('users').insert(newUser)
  return db('users').where('id', id).first()
}

module.exports = { insert };