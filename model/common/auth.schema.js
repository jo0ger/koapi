/**
 * 权限 Model
 */

import md5 from 'md5'
import mongoose from 'mongoose'

const authSchema = new mongoose.Schema({
  name: { type: String, default: config.server.auth.defaultName, required: true },
  password: {
    type: String,
    default: md5(`${config.server.auth.secretKey}${config.server.auth.defaultPassword}`),
    required: true
  },
  slogan: { type: String, default: '' },
  avatar: { type: String, default: '' }
})

export default authSchema
