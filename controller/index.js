/**
 *  controller entry
 */

const fs = require('fs')
const files = fs.readdirSync(__dirname)
let controllers = {}

files.every((file) => {
  if (file !== 'index.js' && file.slice(-3) === '.js') {
    let modelName = file.split('.')[0]
    let fileName = file.slice(0, -3)
    controllers[modelName] = require(`./${fileName}`)
  }
  return true
})

export default controllers
