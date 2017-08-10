/**
 * @desc 公共 api routes
 * @author Jooger
 * @date 10 Aug 2017
 */

import { commonControllers } from '../controller'

const prefix = 'blog'

export default router => {

  // Auth
  router.all('/auth', commonControllers.auth)

  // Option配置信息
  router.all('/option', commonControllers.option)

  // 统计
  router.all('/statistics', commonControllers.statistics)

}
