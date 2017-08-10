/**
 * 七牛获取上传配置
 */

import qiniu from 'qn'
import { QINIU } from '../../config'
import { handleRequest, handleSuccess, handleError } from '../../utils'
const client = qiniu.create(QINIU)
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

export default async (ctx, next) => await handleRequest({ ctx, next, type: qiniuCtrl })
