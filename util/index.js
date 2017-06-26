/**
 * 工具方法
 */
import mongoose from 'mongoose'

exports.handle = require('./handle')
exports.date = require('./date')
exports.validate = require('./validate')
exports.marked = require('./marked')

exports.createObjectId = () => mongoose.Types.ObjectId()

// 首字母大写
exports.firstUpperCase = (str) => {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase())
}
