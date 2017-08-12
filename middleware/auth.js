/**
 * @desc token验证中间件
 * @author Jooger
 */

import jwt from 'jsonwebtoken'
import { AUTH, SERVER } from '../config'
import { handleError } from '../utils'

const UNAUTHORIZED = SERVER.CODE.UNAUTHORIZED

// 需要排除验证的url和method
const exclude = [
  // 排除登录前的auth POST请求
  { url: 'auth', type: ['GET', 'POST'] },
  // 评论 前后台都需要
  { url: 'comment', type: ['POST'] },
  // 点在 前后台都需要
  { url: 'like', type: ['POST'] }
]

// 获取token
function _authToken (req) {
  if (req && req.headers && req.headers.authorization) {
    const auths = req.headers.authorization.split(' ')
    // oauth2的token类型是Bearer或者Mac
    if (auths.length === 2 && auths[0] === 'Bearer') {
      return auths[1]
    }
  }
  return false
}

// 验证权限
export default async (ctx, next) => {
  const { request } = ctx
  const _DEV_ = request.query._DEV_ || request.body._DEV_

  function fail () {
    logger.error('权限校验失败')
    ctx.send(UNAUTHORIZED, {
      code: UNAUTHORIZED,
      message: '少侠，我不认识你！'
    })
  }

  // 如果请求时query或者body上加上_DEV_，并且是开发环境，则全部权限都通过
  // 生产环境下则无此限制，主要是为了开发方便
  if (_DEV_ && process.env.NODE_ENV === 'development') {
    return next && next() || true
  }

  // 权限校验，排除所有非管理员的非GET请求，comment和like接口的POST请求除外，（前台需要评论）
  if (request.method !== 'GET') {
    // 是否排除
    const hasExclude = exclude.find(({ url, type }) => {
      return request.url.includes(url) && type.includes(request.method)
    })
    if (!hasExclude) {
      const token = _authToken(request)
      if (token) {
        try {
          const decodedToken = await jwt.verify(token, AUTH.SECRET_KEY)
          if (decodedToken.exp > Math.floor(Date.now() / 1000)) {
            // _verify 已验证权限
            ctx._verify = true
            return next && next() || true
          }
        } catch (err) {
          logger.error(err)
        }
      }
      return fail()
    }
  }

  return next && next() || true
}
