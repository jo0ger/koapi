/**
 * token验证中间件
 * (暂未知是否做成中间件，待定)
 */

const jwt = require('jsonwebtoken')
const config = require('../config')
const { handleError } = require('../util/handle')

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
module.exports = async (ctx) => {
  const token = _authToken(ctx.request)
  if (token) {
    try {
      const decodedToken = await jwt.verify(token, config.AUTH.SECRET_KEY)
      if (decodedToken.exp > Math.floor(Date.now() / 1000)) {
        return true
      }
    } catch (error) {
      
    }
  }
  return false
}
