/**
 * 验证
 */

const mongoose = require('mongoose')

const firstUpperCase = (str) => {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase())
}

export function isObjectId (str = '') {
  return mongoose.Types.ObjectId.isValid(str)
}

export function isEmail (str = '') {
  return /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/.test(str)
}

export const isType = (obj = {}, type = 'object') => {
  return Object.prototype.toString.call(obj) === `[object ${firstUpperCase(type)}]`
}
