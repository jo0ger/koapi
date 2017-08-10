/**
 * mongodb连接模块
 */

import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'
import md5 from 'md5'
import config from '../config'
import { AuthModel, CategoryModel } from '../model'

mongoose.Promise = global.Promise

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
      limit: config.BLOG.LIMIT
    }
    return this
  },
  hook () {
    this._adminHook()
        ._blogHook()
  },
  _adminHook () {
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
    return this
  },
  _blogHook () {
    // 初始化分类
    const defaultCategory = config.BLOG.DEFAULT_CATEGORY

    defaultCategory.forEach(({ name, description }) => {
      CategoryModel.findOne({ name }).then(category => {
        if (!category) {
          new CategoryModel({ name, description }).save()
        }
      })
    })
    
    return this
  }
}


export default {
  init: db.init.bind(db)
}
