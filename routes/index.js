/**
 * route entry
 */

const config = require('../config')

module.exports = router => {
  // 全局拦截
  router.use('*', (ctx, next) => {
    let { request, response } = ctx
    console.log(request.url);
    const allowedOrigins = ['http://bubblypoker.com', 'http://admin.bubblypoker.com', `http://localhost:${config.SERVER.PORT}`]
    const origin = request.origin || ''
    if (allowedOrigins.includes(origin) || allowedOrigins.includes(`http://localhost:${config.SERVER.PORT}`)) {
      response.set('Access-Control-Allow-Origin', origin)
    }
    response.set("Access-Control-Allow-Headers", "Authorization, Origin, No-Cache, X-Requested-With, If-Modified-Since, Pragma, Last-Modified, Cache-Control, Expires, Content-Type, X-E4M-With")
    response.set("Access-Control-Allow-Methods", "PUT,PATCH,POST,GET,DELETE,OPTIONS")
    response.set("Content-Type", "application/json;charset=utf-8")
    response.set("X-Powered-By", 'Koapi 1.0.0')

    if (request.method === 'OPTIONS') {
      ctx.status = 200
      return false
    }
    return next()
  })


  router.get('/user', (ctx, next) => {
     ctx.success({
       message: 'asd',
       data: {}
     })
  })
}
