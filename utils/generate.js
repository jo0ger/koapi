/**
 * @desc 遍历给定的目录下的非index.js文件
 * @author Jooger
 * @date 10 Aug 2017
 */

import path from 'path'
import fs from 'fs'

export default (dir, cb) => {
  if (!cb) {
    return
  }
  const files = fs.readdirSync(path.resolve(__dirname, '../', dir))
  files.every((file => {
    if (file !== 'index.js' && file.slice(-3) === '.js') {
      const filename = file.slice(0, -3)
      let mod = null
      try {
        mod =require(path.resolve(__dirname, '../', `${dir}/${filename}`))
      } catch (error) {
        console.error(error)
      }
      mod && cb(filename, mod.default && mod.default || mod)
    }
    return true
  }))
}
