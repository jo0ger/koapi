/**
 * @desc 设置相应头
 * @author Jooger
 * @date 10 Aug 2017
 */

import { INFO } from '../config'

export default (ctx, next) => {
  const { request, response } = ctx
  const allowedOrigins = ['http://jooger.me', 'http://admin.jooger.me']
  const origin = request.get('origin') || ''
  if (allowedOrigins.includes(origin) || origin.includes('localhost') || request.query._DEV_) {
    response.set('Access-Control-Allow-Origin', origin)
  }
  response.set("Access-Control-Allow-Headers", "Authorization, Origin, No-Cache, X-Requested-With, If-Modified-Since, Pragma, Last-Modified, Cache-Control, Expires, Content-Type, X-E4M-With")
  response.set("Access-Control-Allow-Methods", "PUT,PATCH,POST,GET,DELETE,OPTIONS")
  response.set("Content-Type", "application/json;charset=utf-8")
  response.set("X-Powered-By", `${INFO.name} ${INFO.version}`)

  if (request.method === 'OPTIONS') {
    ctx.status = 200
    ctx.body = 'ok'
    return
  }

  return next()
}
