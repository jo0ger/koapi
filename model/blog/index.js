/**
 * @desc blog schemas entry
 * @author Jooger
 * @date 11 Aug 2017
 */

import { generate, firstUpperCase } from '../../utils'
const blogSchemas = {}

generate(__dirname, (filename, schema) => {
  blogSchemas[firstUpperCase(filename.split('.')[0])] = schema
})

export default blogSchemas
