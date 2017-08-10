/**
 * @desc 后台管理 api routes
 * @author Jooger
 * @date 10 Aug 2017
 */

import { adminControllers } from '../controller'

const prefix = '/admin'

export default router => {
  // 七牛云获取uptoken
  router.all(`${prefix}/qiniu`, adminControllers.qiniu)
}
