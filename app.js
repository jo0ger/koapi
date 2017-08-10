import Koa from 'koa'
import Router from 'koa-router'
import bodyparser from 'koa-bodyparser'
import httpLogger from 'koa-logger'
import respond from 'koa-respond'
import minimist from 'minimist'

import config from './config'
import db from './mongoose'
import routes from './routes'
import { logger, handleError } from './utils'

const app = new Koa()
const router = new Router({
  prefix: `/${config.SERVER.VERSION}`
})

global.logger = logger

// 数据库连接
db.init()

// middlewares
app.use(bodyparser())
app.use(httpLogger())
app.use(respond({
  methods: {
    success: (ctx, body) => {
      body = Object.assign({}, {
        code: config.SERVER.CODE.SUCCESS
      }, body)
      ctx.send(200, body)
    },
    failed: (ctx, body) => {
      body = Object.assign({}, {
        code: config.SERVER.CODE.FAILED
      }, body)
      ctx.send(200, body)
    }
  }
}))

// routes 绑定
routes(router)
app.use(router.routes(), router.allowedMethods())

// 错误监听
app.on('error', (err, ctx) => {
  console.log(err);
  logger.error('server error', err)
})

// 设置 Cookie 签名密钥
// 签名密钥只在配置项 signed 参数为真是才会生效
app.keys = [config.AUTH.SECRET_KEY]

export default app
