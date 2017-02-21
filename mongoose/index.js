/**
 * mongodb连接模块
 */

const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const config = require('../config')
mongoose.Promise = global.Promise

module.exports = {
  mongoose,
  init () {
    this.connect().plugin()
  },
  connect () {
    mongoose.connect(config.MONGODB.URI)
    const conn = mongoose.connection
    conn.on('error', () => {
      logger.error(`Mongodb数据库连接错误`)
    })
    conn.once('open', async function () {
      logger.info(`Mongodb数据库连接成功`)
    })
    return this
  },
  plugin () {
    // 分页
    mongoosePaginate.paginate.options = {
      limit: config.SERVER.LIMIT
    }
  }
}
