/**
 * @desc gravatar头像
 * @author Jooger
 * @email zzy1198258955@163.com
 * @date 27 Aug 2017
 */

import gravatar from 'gravatar'
import { isEmail } from './tool'

export default (email, opt = {}) => {
  if (!isEmail(email)) {
    return config.blog.defaultAvatar
  }

  const isHttps = config.server.protoco === 'https'

  const url = gravatar.url(email, {
    s: '100',
    r: 'x',
    d: 'retro',
    protocol: config.server.protocol,
    ...opt
  })

  return url.replace(isHttps ? 'https://s.gravatar.com' : 'http://www.gravatar.com', `http${isHttps ? 's' : ''}://gravatar.jooger.me`)
}
