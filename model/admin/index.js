/**
 * @desc admin schemas entry
 * @author Jooger
 * @email zzy1198258955@163.com
 * @date 20 Aug 2017
 */

import { generate, firstUpperCase } from '../../utils'
const adminSchemas = {}

generate(__dirname, (filename, schema) => {
  adminSchemas[firstUpperCase(filename.split('.')[0])] = schema
})

export default adminSchemas
