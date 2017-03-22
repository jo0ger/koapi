/**
 * 验证
 */

const mongoose = require('mongoose')

export function isObjectId (str = '') {
  return mongoose.Types.ObjectId.isValid(str)
}

export function isEmail (str = '') {
  return /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/.test(str)
}
