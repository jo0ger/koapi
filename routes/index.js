/**
 * route entry
 */

const config = require('../config')
const { UNAUTHORIZED, NOT_FOUND } = config.SERVER.CODE
const controllers = require('../controller')
const authIsVerified = require('../middleware/auth')

module.exports = router => {
  // 全局拦截
  router.use('*', async (ctx, next) => {
    let { request, response } = ctx
    const allowedOrigins = ['http://jooger.me', 'http://admin.jooger.me']
    const origin = request.get('origin') || ''
    if (allowedOrigins.includes(origin) || origin.includes('localhost') || request.query._DEV_) {
      response.set('Access-Control-Allow-Origin', origin)
    }
    response.set("Access-Control-Allow-Headers", "Authorization, Origin, No-Cache, X-Requested-With, If-Modified-Since, Pragma, Last-Modified, Cache-Control, Expires, Content-Type, X-E4M-With")
    response.set("Access-Control-Allow-Methods", "PUT,PATCH,POST,GET,DELETE,OPTIONS")
    response.set("Content-Type", "application/json;charset=utf-8")
    response.set("X-Powered-By", `Koapi ${config.INFO.version}`)

    if (request.method === 'OPTIONS') {
      ctx.status = 200
      return false
    }

    // 排除登录前的auth POST请求
    if (request.url === '/auth' && (request.method === 'GET' || request.method === 'POST')) {
      return next()
    }

    // 权限校验，排除所有非管理员的非GET请求，comment和like接口的POST请求除外，（前台需要评论）
    if (!await authIsVerified(ctx) && request.method !== 'GET' && !((request.url.includes('comment') || request.url.includes('like')) && request.method === 'POST')) {
      logger.error('权限校验失败')
      ctx.send(UNAUTHORIZED, {
        code: UNAUTHORIZED,
        message: '禁地勿闯！！！'
      })
      return
    }

    return next()
  })

  // Qiniu upload config
  router.all('/qiniu', controllers.qiniu)

  // Auth
  router.all('/auth', controllers.auth)

  // Like 点赞
  router.all('/like', controllers.like)

  // Article文章
  router.all('/article', controllers.article.list)
  router.all('/article/:id', controllers.article.item)

  // Archive文章归档
  router.all('/archive', controllers.archive)

  // Category分类
  router.all('/category', controllers.category.list)
  router.all('/category/:id', controllers.category.item)

  // Tag标签
  router.all('/tag', controllers.tag.list)
  router.all('/tag/:id', controllers.tag.item)

  // Comment评论
  router.all('/comment', controllers.comment.list)
  router.all('/comment/:id', controllers.comment.item)

  // Option配置信息
  router.all('/option', controllers.option)

  router.all('/statistics', controllers.statistics)

  router.all('*', async (ctx, next) => {
    ctx.send(NOT_FOUND, {
      code: -1,
      message: '少侠，此API无效'
    })
  })
}
