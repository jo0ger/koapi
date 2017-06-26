/**
 * 七牛获取上传配置
 */

const qiniu = require('qn')
const { QINIU } = require('../config')
const client = qiniu.create(QINIU)
const { handle: { handleRequest, handleSuccess, handleError } } = require('../util')
const qiniuCtrl = {}

qiniuCtrl.GET = async (ctx, next) => {
  handleSuccess({
    ctx,
    message: '获取七牛uptoken成功',
    data: {
      uptoken: client.uploadToken(),
      bucket: QINIU.bucket,
      domain: QINIU.origin,
      uploadUrl: QINIU.uploadUrl
    }
  })
}

module.exports = async (ctx, next) => await handleRequest({ ctx, next, type: qiniuCtrl })
