/**
 * model entry
 */

const fs = require('fs')
const files = fs.readdirSync(__dirname)
let models = {}

files.every((file) => {
  if (file !== 'index.js' && file.slice(-3) === '.js') {
    let modelName = file.split('.')[0]
    let fileName = file.slice(-3)
    models[modelName] = buildSchema(require('./' + filename))
  }
  return true
})

function buildSchema (schema) {
  if (!schema) {
    return
  }
  schema.set('versionKey', false)
  schema.set('toObject', { getters: true })
  schema.set('toJSON', { getters: true, virtuals: false })
  schema.path('create_at').set(val => new Date(val).getTime())
  schema.path('update_at').set(val => new Date(val).getTime())
  return schema
}

export default models