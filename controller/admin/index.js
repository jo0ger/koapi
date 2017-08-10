/**
 * @desc 后台api处理入口
 * @author Jooger
 * @date 10 Aug 2017
 */

import { generate, firstUpperCase } from '../../utils'
const adminControllers = {}

generate(__dirname, (filename, controller) => {
  adminControllers[filename.split('.')[0]] = controller
})

export default adminControllers
