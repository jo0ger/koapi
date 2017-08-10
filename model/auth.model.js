/**
 * 权限 Model
 */

import md5 from 'md5'
import mongoose from 'mongoose'
import { AUTH } from '../config'

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

export default authSchema
