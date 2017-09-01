/**
 * mongodb连接模块
 */

import mongoose from 'mongoose'
// import mongoosePaginate from 'mongoose-paginate'
import md5 from 'md5'
import config from '../config'

mongoose.Promise = global.Promise

export default {
  async init () {
    this.connect()
    await this.hook()
  },
  connect () {
    mongoose.connect(config.server.mongodb.uri)
    const conn = mongoose.connection
    conn.on('error', () => {
      logger.error(`Mongodb数据库连接错误`)
    })
    conn.once('open', () => {
      logger.info(`Mongodb数据库连接成功`)
    })
    return this
  },
  // plugin () {
  //   // 分页
  //   mongoosePaginate.paginate.options = {
  //     limit: config.blog.postLimit
  //   }
  //   return this
  // },
  async hook () {
    await optionHook()
    await adminHook()
    // await blogHook()
  }
}


// 初始化配置
async function optionHook () {
  const { OptionModel } = require('../model')
  let option = await OptionModel.findOne().exec()
  try {
    if (!option) {
      option = await new OptionModel().save()
    }
  } catch (error) {
    logger.error('配置初始化失败')
  }
  Object.assign(global.config, option.toObject())
  logger.info('配置初始化成功')
}

// 初始化管理员
async function adminHook () {
  const { AuthModel } = require('../model')
  const admin = await AuthModel.findOne().catch(err => logger.error(err.message))
  if (!admin) {
    try {
      const adminInfo = require('../config/admin')
      await AuthModel.create(
        Object.assign({}, adminInfo, {
          password: md5(`${config.server.auth.secretKey}${adminInfo.password}`)
        })
      ).then(a => {
        logger.info(`admin初始化成功`)
        logger.info(`管理员：${a.name}`)
      })
    } catch (error) {
      logger.error('admin初始化失败，err: ' + error.message)
    }
  }
}

// 初始化分类
async function blogHook () {
  const { CategoryModel } = require('../model')
  const defaultCategory = config.blog.defaultCategory
  for (let i = 0; i < defaultCategory.length; i++) {
    const { name, description } = defaultCategory[i]
    await CategoryModel.findOne({ name }).then(category => {
      if (!category) {
        new CategoryModel({ name, description }).save()
      }
    })
  }
}
