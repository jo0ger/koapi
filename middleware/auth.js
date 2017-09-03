/**
 * @desc token验证
 * @author Jooger
 */

import jwt from 'jsonwebtoken'
import config from '../config'
import { handleError } from '../utils'

const UNAUTHORIZED = config.server.code.UNAUTHORIZED

// 非GET请求中，需要排除验证的url和method
const EXCLUDE_AUTH = [
  // 排除登录前的auth POST请求
  { url: 'auth', type: ['POST'] },
  // 评论 前后台都需要
  { url: 'comment', type: ['POST'] },
  // 点在 前后台都需要
  { url: 'like', type: ['POST'] }
]

// GET请求中，需要验证的url和method
const INCLUDE_AUTH = [
  { url: 'comment/author', type: ['GET'] },
  { url: 'admin/qiniu', type: ['GET'] },
  { url: 'admin/message', type: ['GET'] },
]

// 从Headers中获取token
// function getTokenFromHeader (ctx) {
//   if (req && req.headers && req.headers.authorization) {
//     const auths = req.headers.authorization.split(' ')
//     // oauth2的token类型是Bearer或者Mac
//     if (auths.length === 2 && auths[0] === 'Bearer') {
//       return auths[1]
//     }
//   }
//   return false
// }

async function verifyToken (ctx) {
  const token = ctx.cookies.get(config.server.auth.cookieName, { signed: true })
  if (token) {
    try {
      const decodedToken = await jwt.verify(token, config.server.auth.secretKey)
      if (decodedToken.exp > Math.floor(Date.now() / 1000)) {
        // 已验证权限
        return true
      }
    } catch (err) {
      logger.error(err)
      return false
    }
  }
  return false
}

// 验证权限
export default async (ctx, next) => {
  const request = ctx.request
  const _DEV_ = request.query._DEV_ || request.body._DEV_

  ctx._verify = false

  // 如果请求时query或者body上加上_DEV_，并且是开发环境，则全部权限都通过
  // 生产环境下则无此限制，主要是为了开发方便
  if (_DEV_ && process.env.NODE_ENV === 'development' || await verifyToken(ctx)) {
    ctx._verify = true
    return next && next()
  }

  // 权限校验，排除所有非管理员的非GET请求，comment和like接口和autho接口的请求除外，（前台需要评论）
  if (request.method !== 'GET') {
    // 是否排除
    const hasExclude = EXCLUDE_AUTH.find(({ url, type }) => request.url.includes(url) && type.includes(request.method))
    if (!hasExclude) {
      if (await verifyToken(ctx)) {
        // _verify 已验证权限
        ctx._verify = true
        return next()
      }
      return fail()
    }
  } else {
    // 是否是需要验证的get
    const hasInclude = INCLUDE_AUTH.find(({ url, type }) => request.url.includes(url) && type.includes(request.method))
    if (hasInclude) {
      if (await verifyToken(ctx)) {
        // _verify 已验证权限
        ctx._verify = true
        return next()
      }
      return fail()
    }
  }

  function fail () {
    logger.error('权限校验失败')
    ctx.send(UNAUTHORIZED, {
      code: UNAUTHORIZED,
      message: '少侠，我不认识你！'
    })
  }
  console.log(ctx._verify)
  return next()
}
