/**
 * @desc 后台管理 api routes
 * @author Jooger
 * @date 10 Aug 2017
 */

import { adminControllers } from '../controller'

const prefix = '/admin'

export default router => {
  // 七牛云获取uptoken
  router.all(`${prefix}-qiniu`, `${prefix}/qiniu`, adminControllers.qiniu)

  // 消息获取
  router.all(`${prefix}-message`, `${prefix}/message`, adminControllers.message.list)
  router.all(`${prefix}-message-id`, `${prefix}/message/:id`, adminControllers.message.item)

}
