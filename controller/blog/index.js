/**
 * @desc 博客处理入口
 * @author Jooger
 * @date 10 Aug 2017
 */

import { generate, firstUpperCase } from '../../utils'
const blogControllers = {}

generate(__dirname, (filename, controller) => {
  blogControllers[filename.split('.')[0]] = controller
})

export default blogControllers
