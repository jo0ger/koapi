/**
 * @desc request 参数校验
 * @author Jooger
 * @date 11 Aug 2017
 * @usage
 * 
 * const validator = new Validator(config)
 * 
 * const result = validator.validate(data, keys, customConfig)
 * 
 * validator.addRule(config)
 * 
 * validator.removeRule(key) // key | key.key.key
 */

import validator from 'validator'
import { isType } from './tool'

export default class Validator {
  constructor (config = {}) {
    this._config = config
  }

  validate (data = {}, keys = [], config = {}) {
    const result = { code: -1 }
    if (!isType(data, 'Object')) {
      result.message = '待校验数据必须是Object类型'
      return result
    }
    if (keys && !isType(keys, 'Array')) {
      result.message = '待校验属性必须是Array类型'
      return result
    }
    if (config && !isType(config, 'Object')) {
      result.message = '自定义校验配置必须是Object类型'
      return result
    }
    config = Object.assign({}, this._config, config)
    for (let key in keys) {
      // key必须是string
      if (isType(key, 'String')) {
        const conf = config[key]
        if (!conf) {
          console.warn(`未找到{ ${key} }属性的校验配置，将忽略{ ${key} }的校验`)
          continue
        }
        const { required, message } = conf
        const value = data[key]
        const error = null
        if (required && (error = requireFilter(value, key, result))) {
          return error
        }
        if () {

        }
      }
    }
    return result
  }
}

function requireFilter (value, key, result = {}) {
  if (isType(value, 'Undefined')) {
    result.message = `${key}的值是undefined`
    return result
  } else if (isType(value, 'Null')) {
    result.message = `${key}的值是null`
    return result
  } else if (isType(value, 'String') && value.length === 0) {
    result.message = `${key}的值是空字符串`
    return result
  }
  return false
}
