/**
 * @desc route entry
 * @author Jooger
 */

import controllers from '../controller'
import { auth, setHeader } from '../middleware'
import { generate, firstUpperCase } from '../utils'

const { UNAUTHORIZED, NOT_FOUND } = config.server.code

export default router => {
  // 全局拦截
  router.use('*', setHeader)

  router.use('*', auth)

  // 生成routes表，并绑定router
  generate(__dirname, (filename, routerBinder) => routerBinder(router))

  router.all('*', async (ctx, next) => {
    ctx.send(NOT_FOUND, {
      code: -1,
      message: '少侠，此API无效'
    })
  })

}
