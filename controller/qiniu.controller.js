/**
 * 七牛获取token
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
      uptoken: client.uploadToken()
    }
  })
}

module.exports = async (ctx, next) => await handleRequest({ ctx, next, type: qiniuCtrl })
