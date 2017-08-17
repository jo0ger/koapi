/**
 * 配置 controller
 */

import { handleRequest, handleSuccess, handleError, isType, isObjectId } from '../../utils'
import { OptionModel } from '../../model'
const optionCtrl = {}

// 全部的配置信息分类
// vps不能暴露给其他人
const OPTION_TYPES = ['common', 'blog', 'project', 'music']

/**
 * @desc 获取配置信息
 * @param  {String} [optional] type     配置信息类型，不填且登录状态下为全部类型
 */
optionCtrl.GET = async (ctx, next) => {
  let type = ctx.query.type

  if (type && isType(type, 'String')) {
    type = type.split(' ')
    for (let i in type) {
      if (!OPTION_TYPES.includes(type[i])) {
        type.splice(i--, 1)
      }
    }
    type = type.join(' ')
  } else if (ctx._verify) {
    type = OPTION_TYPES.join(' ')
  } else {
    return handleError({ ctx, message: '未知类型的配置信息请求' })
  }

  await OptionModel.findOne({})
    .select(type + ' -_id')
    .exec()
    .then(data => {
      handleSuccess({ ctx, data, message: '配置信息获取成功' })
    })
    .catch(err => {
      handleError({ ctx, err, message: '配置信息获取失败' })
    })
}

// 新增配置信息
optionCtrl.POST = async (ctx, next) => {
  await new OptionModel(ctx.request.body.option).save()
    .then(data => {
      handleSuccess({ ctx, data, message: '新增配置信息成功' })
    })
    .catch(err => {
      handleError({ ctx, err, message: '新增配置信息失败' })
    })
}

// 修改配置信息
optionCtrl.PUT = async (ctx, next) => {
  let option = ctx.request.body
  let { _id } = option
  if (!isObjectId(_id)) {
    return handleError({ ctx, message: '缺少配置信息id' })
  }
  await OptionModel.findByIdAndUpdate(_id, { $set: { ...option } }, { new: true }).exec() 
    .then(data => {
      handleSuccess({ ctx, data, message: '修改配置信息成功' })
    })
    .catch(err => {
      handleError({ ctx, err, message: '修改配置信息失败' })
    })
}



export default async (ctx, next) => await handleRequest({ctx, next, type: optionCtrl })