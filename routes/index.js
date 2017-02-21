/**
 * route entry
 */

const config = require('../config')
const { UNAUTHORIZED } = config.SERVER.CODE
const controllers = require('../controller')
const authIsVerified = require('../middleware/auth')

module.exports = router => {
  // 全局拦截
  router.use('*', async (ctx, next) => {
    let { request, response } = ctx
    const allowedOrigins = ['http://bubblypoker.com', 'http://admin.bubblypoker.com']
    const origin = request.get('origin') || ''
    if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
      ctx.response.set('Access-Control-Allow-Origin', origin)
    }
    ctx.response.set("Access-Control-Allow-Headers", "Authorization, Origin, No-Cache, X-Requested-With, If-Modified-Since, Pragma, Last-Modified, Cache-Control, Expires, Content-Type, X-E4M-With")
    ctx.response.set("Access-Control-Allow-Methods", "PUT,PATCH,POST,GET,DELETE,OPTIONS")
    ctx.response.set("Content-Type", "application/json;charset=utf-8")
    ctx.response.set("X-Powered-By", `Koapi ${config.INFO.version}`)

    if (request.method === 'OPTIONS') {
      ctx.status = 200
      return false
    }
    if (!await authIsVerified(ctx) && ctx.request.url !== 'GET') {
      ctx.send(UNAUTHORIZED, {
        code: UNAUTHORIZED,
        message: '禁地勿闯！！！'
      })
      return
    }

    return next()
  })

  // Category分类
  router.all('/category', controllers.category.list)
  router.all('/category/:id', controllers.category.item)

  // Tag标签
  router.all('/tag', controllers.tag.list)
  router.all('/tag/:id', controllers.tag.item)
}
