/**
 * @desc Koapi entry
 * @author Jooger
 */

import Koa from 'koa'
import Router from 'koa-router'
import bodyparser from 'koa-bodyparser'
import httpLogger from 'koa-logger'
import respond from 'koa-respond'
import minimist from 'minimist'

const app = new Koa()

global.config = require('./config')
global.logger = require('./utils').logger

async function start () {

  // 数据库连接
  await require('./mongoose').init()

  // middlewares
  app.use(bodyparser())
  app.use(httpLogger())
  app.use(respond({
    methods: {
      success: (ctx, body) => {
        body = Object.assign({}, {
          code: config.server.code.SUCCESS
        }, body)
        ctx.send(200, body)
      },
      failed: (ctx, body) => {
        body = Object.assign({}, {
          code: config.server.code.FAILED
        }, body)
        ctx.send(200, body)
      }
    }
  }))

  // routes 绑定
  const router = new Router({
    prefix: `/${config.server.version}`
  })
  require('./routes')(router)
  app.use(router.routes(), router.allowedMethods())

  // 错误监听
  app.on('error', (err, ctx) => {
    console.log(err);
    logger.error('server error', err)
  })

  // 设置 Cookie 签名密钥
  // 签名密钥只在配置项 signed 参数为真是才会生效
  app.keys = [config.server.auth.secretKey]

}

start()

export default app
