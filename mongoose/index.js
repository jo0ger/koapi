/**
 * mongodb连接模块
 */

const mongoose = require('mongoose')
const config = require('../config')
mongoose.Promise = global.Promise

module.exports = {
  mongoose,
  init () {
    mongoose.connect(config.MONGODB.URI)
    const conn = mongoose.connection
    conn.on('error', () => {
      logger.error(`===================数据库连接错误 version：${mongoose.version}===================`)
    })
    conn.once('open', async function () {
      logger.info(`===================数据库连接成功 version：${mongoose.version}===================`)
    })
  }
}
