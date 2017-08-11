/**
 * @desc 公共api处理入口
 * @author Jooger
 * @date 10 Aug 2017
 */

import { generate } from '../../utils'
const commonControllers = {}

generate(__dirname, (filename, controller) => {
  commonControllers[filename.split('.')[0]] = controller
})

export default commonControllers
