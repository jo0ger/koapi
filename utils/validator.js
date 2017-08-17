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
import { isType, isObjectId } from './tool'

const types = ['string', 'object', 'number', 'array', 'boolean', 'objectId']

export default class Validator {
  constructor (config = {}) {
    this._config = config
  }

  validate (data, keys, config) {
    const result = { success: false }
    config = Object.assign({}, this._config, config)
    if (!isType(data, 'Object')) {
      result.message = '待校验数据必须是Object类型'
      return result
    }
    if (!isType(keys, 'Array')) {
      if (isType(keys, 'String')) {
        keys = [keys]
      } else {
        keys = Object.keys(config)
      }
    }
    if (config && !isType(config, 'Object')) {
      result.message = '自定义校验配置必须是Object类型'
      return result
    }
    for (let index in keys) {
      let key = keys[index]
      // key必须是string
      if (isType(key, 'String')) {
        const conf = config[key]
        if (!conf) {
          console.warn(`未找到{ ${key} }属性的校验配置，将忽略{ ${key} }的校验`)
          continue
        }
        if (this.validateOne(data[key], key, conf, result)) {
          return result
        }
      }
    }
    result.success = true
    result.message = '检验成功'
    return result
  }

  validateOne (value, key, conf, result) {
    const error = null
    if (isType(conf.message, 'String')) {
      conf.message = {
        required: conf.message
      }
    }
    if (requireFilter(value, key, conf, result)) {
      return result
    } else if (typeFilter(value, key, conf, result)) {
      return result
    } else if (validateFilter(value, key, conf, result)) {
      return result
    }
    return false
  }
}

function requireFilter (value, key, conf, result = {}) {
  if (conf.required) {
    const { required } = conf.message || {}
    if (isType(value, 'undefined')) {
      result.message = required || `${key}的值是undefined`
      return result
    } else if (isType(value, 'Null')) {
      result.message = required || `${key}的值是null`
      return result
    } else if (isType(value, 'String') && value.length === 0) {
      result.message = required || `${key}的值是空字符串`
      return result
    }
  }
  return false
}

function typeFilter (value, key, conf, result) {
  const typeMessage = conf.message.type || ''
  const { type, required } = conf
  let error = false
  // required或者有值的情况下，校验类型
  if (required || value) {
    if (types.find(item => item === type)) {
      switch (type) {
        case 'objectId':
          if (!isObjectId(value)) {
            error = true
          }
          break
        default:
          if (!isType(value, type)) {
            error = true
          }
          break
      }
    } else {
      result.message = `${key}的校验类型 ${type} 不在校验范围`
      return result
    }
  }
  if (error) {
    result.message = typeMessage || `${key}的值不是${type}类型`
    return result
  }
  return false
}

function validateFilter (value, key, conf, result = {}) {
  if (conf.validate && value) {
    const { validate } = conf.message || {}
    if (!isType(conf.validate, 'Function')) {
      return console.error(`${key}的配置参数validate不是函数`)
    }
    if (!conf.validate(value)) {
      result.message = validate || `${key}校验失败`
      return result
    }
  }
  return false
}
