/**
 * 配置 controller
 */

import { handleRequest, handleSuccess, handleError, isObjectId } from '../../utils'
import { OptionModel } from '../../model'
const optionCtrl = {}

// 获取配置信息
optionCtrl.GET = async (ctx, next) => {
  await OptionModel.findOne({}).exec()
    .then(data => {
      handleSuccess({ ctx, data, message: '配置信息获取成功' })
    })
    .catch(err => {
      handleError({ ctx, err, message: '配置信息获取失败' })
    })
}

// 新增配置信息
optionCtrl.POST = async (ctx, next) => {
  let { option, option: { title, siteUrl, bannerDefaultImg } } = ctx.request.body
  if (!title) {
    return handleError({ ctx, message: '缺少主标题' })
  }
  if (!siteUrl) {
    return handleError({ ctx, message: '缺少网站地址' })
  }
  if (!bannerDefaultImg) {
    return handleError({ ctx, message: '缺少banner默认图' })
  }
  
  await new OptionModel(option).save()
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