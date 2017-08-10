/**
 * token验证中间件
 * (暂未知是否做成中间件，待定)
 */

import jwt from 'jsonwebtoken'
import { AUTH } from '../config'
import { handleError } from '../utils'

// 验证token
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
export default async (ctx) => {
  const { request } = ctx
  const _DEV_ = request.query._DEV_ || request.body._DEV_ || false
  
  // 如果请求时query或者body上加上_DEV_，并且是开发环境，则全部权限都通过
  // 生产环境下则无此限制，主要是为了开发方便
  if (_DEV_ && process.env.NODE_ENV === 'development') {
    return true
  }

  const token = _authToken(request)
  if (token) {
    try {
      const decodedToken = await jwt.verify(token, AUTH.SECRET_KEY)
      if (decodedToken.exp > Math.floor(Date.now() / 1000)) {
        return true
      }
    } catch (error) {
      
    }
  }
  return false
}
