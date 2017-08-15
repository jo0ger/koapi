/**
 * 七牛获取上传配置
 */

import qn from 'qn'
import { handleRequest, handleSuccess, handleError } from '../../utils'
const qiniuConfig = config.thirdParty.qiniu
const client = qn.create(qiniuConfig)
const qiniuCtrl = {}

qiniuCtrl.GET = async (ctx, next) => {
  handleSuccess({
    ctx,
    message: '获取七牛uptoken成功',
    data: {
      uptoken: client.uploadToken(),
      bucket: qiniuConfig.bucket,
      domain: qiniuConfig.origin,
      uploadUrl: qiniuConfig.uploadUrl
    }
  })
}

export default async (ctx, next) => await handleRequest({ ctx, next, type: qiniuCtrl })
