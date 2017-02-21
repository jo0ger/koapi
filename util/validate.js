/**
 * 验证
 */

const mongoose = require('mongoose')

export function isObjectId (str = '') {
  return mongoose.Types.ObjectId.isValid(str)
}
