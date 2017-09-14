/**
 * 配置 controller
 */

import { handleRequest, handleSuccess, handleError, isType, isObjectId, gravatar } from '../../utils'
import { OptionModel } from '../../model'
import { updateQiniuClient } from '../admin/qiniu.controller'

const optionCtrl = {}

// 全部的配置信息分类
// vps不能暴露给其他人
const OPTION_TYPES = ['common', 'blog', 'project', 'music', 'gallery']

/**
 * @desc 获取配置信息
 * @param  {String} [optional] type     配置信息类型，不填且登录状态下为全部类型
 */
optionCtrl.GET = async (ctx, next) => {
  let type = ctx.query.type

  if (type && isType(type, 'String')) {
    type = type.split(' ')
    for (let i = 0; i < type.length; i++) {
      if (!OPTION_TYPES.includes(type[i])) {
        type.splice(i--, 1)
      }
    }
    if (!type.length) {
      return handleError({ ctx, message: '未知类型的配置信息请求' })
    }
    type = type.join(' ')
  } else if (ctx._verify) {
    type = OPTION_TYPES.join(' ')
  } else {
    return handleError({ ctx, message: '未知类型的配置信息请求' })
  }

  let data = await OptionModel.findOne({})
    .select(type + ' -_id')
    .exec()
    .catch(err => handleError({ ctx, err, message: '配置信息获取失败' }))

  if (data) {
    data = data.toObject()
    if (data.blog) {
      data.blog.avatar = gravatar(data.blog.email)
    }
    handleSuccess({ ctx, data, message: '配置信息获取成功' })
  } else {
    handleError({ ctx, message: '配置信息获取失败' })
  }
}

// 新增配置信息
optionCtrl.POST = async (ctx, next) => {
  const existOption = await OptionModel.findOne().exec()
  if (existOption) {
    return handleError({ ctx, message: '配置信息已存在，请勿重复添加' })
  }
  await new OptionModel(ctx.request.body.option).save()
    .then(data => {
      handleSuccess({ ctx, data, message: '新增配置信息成功' })
      // 更新七牛云API客户端配置
      updateQiniuClient(opt.thirdParty.qiniu)
      // 更新全局配置
      updateConfig(data)
    })
    .catch(err => {
      handleError({ ctx, err, message: '新增配置信息失败' })
    })
}

// 修改配置信息
optionCtrl.PATCH = async (ctx, next) => {
  const option = ctx.request.body
  const { _id, ...rest } = option
  if (!isObjectId(_id)) {
    return handleError({ ctx, message: '缺少配置信息id' })
  }
  const data = await OptionModel.findByIdAndUpdate(_id, { $set: { ...rest } }, { new: true }).exec() 
    .catch(err => {
      handleError({ ctx, err, message: '修改配置信息失败' })
    })
  if (data) {
    handleSuccess({ ctx, data, message: '修改配置信息成功' })
    // 更新七牛云API客户端配置
    updateQiniuClient(opt.thirdParty.qiniu)
    // 更新全局配置
    updateConfig(data)
  } else {
    handleError({ ctx, err, message: '修改配置信息失败' })
  }
}

// 更新全局配置
function updateConfig (opt = {}) {
  Object.assign(global.config, opt.toObject ? opt.toObject() : null)
}

export default async (ctx, next) => await handleRequest({ctx, next, type: optionCtrl })