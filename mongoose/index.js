/**
 * mongodb连接模块
 */

const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const md5 = require('md5')
const config = require('../config')
mongoose.Promise = global.Promise
const { AuthModel } = require('../model')

const db = {
  init () {
    this.connect().plugin().hook()
  },
  connect () {
    mongoose.connect(config.MONGODB.URI)
    const conn = mongoose.connection
    conn.on('error', () => {
      logger.error(`Mongodb数据库连接错误`)
    })
    conn.once('open', () => {
      logger.info(`Mongodb数据库连接成功`)
    })
    return this
  },
  plugin () {
    // 分页
    mongoosePaginate.paginate.options = {
      limit: config.SERVER.LIMIT
    }
    return this
  },
  hook () {
    AuthModel.findOne({}).then(admin => {
      if (!admin) {
        try {
          let adminInfo = require('../config/admin')
          AuthModel.create(
            Object.assign({}, adminInfo, {
              password: md5(`${config.AUTH.SECRET_KEY}${adminInfo.password}`)
            })
          ).then(a => {
            logger.info(`admin初始化成功`)
            logger.info(`管理员：${a.name}`)
          })
        } catch (error) {
          logger.error('admin初始化失败')        
        }
      } else {
        logger.info(`管理员：${admin.name}`)
      }
    })
  }
}


module.exports = {
  init: db.init.bind(db)
}
