/**
 * 权限 Model
 */

const md5 = require('md5')
const mongoose = require('mongoose')
const { AUTH } = require('../config')

const authSchema = new mongoose.Schema({
  name: { type: String, default: AUTH.DEFAULT_NAME, required: true },
  password: {
    type: String,
    default: md5(`${AUTH.SECRET_KEY}${AUTH.DEFAULT_PASSWORD}`),
    required: true
  },
  slogan: { type: String, default: '' },
  avatar: { type: String, default: '' }
})

module.exports = authSchema
