/**
 * @desc 设置相应头
 * @author Jooger
 * @date 10 Aug 2017
 */

export default (ctx, next) => {
  const { request, response } = ctx
  const allowedOrigins = config.server.auth.allowedOrigins
  const origin = request.get('origin') || ''
  const allowed = origin.includes('localhost') || request.query._DEV_ || allowedOrigins.find(item => origin.includes(item))
  if (allowed) {
    response.set('Access-Control-Allow-Origin', origin)
  }
  response.set("Access-Control-Allow-Headers", "Authorization, Origin, No-Cache, X-Requested-With, If-Modified-Since, Pragma, Last-Modified, Cache-Control, Expires, Content-Type, X-E4M-With")
  response.set("Access-Control-Allow-Methods", "PUT,PATCH,POST,GET,DELETE,OPTIONS")
  response.set("Access-Control-Allow-Credentials", true)
  response.set("Content-Type", "application/json;charset=utf-8")
  response.set("X-Powered-By", `${config.info.name} ${config.info.version}`)

  if (request.method === 'OPTIONS') {
    ctx.status = 200
    ctx.body = 'ok'
    return
  }

  return next()
}
