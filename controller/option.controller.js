/**
 * 配置 controller
 */

const { 
  handle: { handleRequest, handleSuccess, handleError },
  validate: { isObjectId }
} = require('../util')
const { OptionModel } = require('../model')
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
  let { option, option: { title, site_url, banner_default_image } } = ctx.request.body
  if (!title) {
    return handleError({ ctx, message: '缺少主标题' })
  }
  if (!site_url) {
    return handleError({ ctx, message: '缺少网站地址' })
  }
  if (!banner_default_image) {
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



module.exports = async (ctx, next) => await handleRequest({ctx, next, type: optionCtrl })