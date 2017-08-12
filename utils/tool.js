/**
 * @desc 日常工具
 * @author Jooger
 * @date 10 Aug 2017
 */

import mongoose from 'mongoose'

export const createObjectId = () => mongoose.Types.ObjectId()

// 首字母大写
export const firstUpperCase = (str) => {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase())
}

/* 类型检测
 * @param {*} obj 检测对象
 * @param {String | Array[String]} type 类型（数组）
 */
export const isType = (obj = {}, type = 'Object') => {
  if (!Array.isArray(type)) {
    type = [type]
  }
  return type.some(t => Object.prototype.toString.call(obj) === `[object ${firstUpperCase(t)}]`)
}

export function isObjectId (str = '') {
  return mongoose.Types.ObjectId.isValid(str)
}

export function isEmail (str = '') {
  return /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/.test(str)
}

/**
 * 将时间输出为统一的格式
 * @param  {Date | String} date
 * @param  {String} fmt  参考yyyy-MM-dd hh:mm:ss:S q
 * @returns {String}
 */
export const fmtDate = (date, fmt = 'yyyy-MM-dd hh:mm') => {
  date = new Date(date)
  let o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    'S': date.getMilliseconds() // 毫秒
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
    }
  }
  return fmt
}

/**
 * Deep Copy
 * @param {Object | Array} out
 * @return {Object | Array} out
 * @usage deepCopy({}[, obj, obj2, ...]) | deepCopy([][, arr1, arr2, ...])
 * @return {Object | Array}
 */
export const deepCopy = function (out = {}) {
  for (let i = 1; i < arguments.length; i++) {
    const obj = arguments[i]

    if (!obj) {
      continue
    }

    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object') {
          out[key] = Array.isArray(obj[key]) ? [] : {}
          deepCopy(out[key], obj[key])
        } else {
          out[key] = obj[key]
        }
      }
    }
  }
  return out
}
