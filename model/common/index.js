/**
 * @desc common schemas entry
 * @author Jooger
 * @date 11 Aug 2017
 */

import { generate, firstUpperCase } from '../../utils'
const commonSchemas = {}

generate(__dirname, (filename, schema) => {
  commonSchemas[firstUpperCase(filename.split('.')[0])] = schema
})

export default commonSchemas
