/**
 * 七牛获取上传配置
 */

import qn from 'qn'
import { handleRequest, handleSuccess, handleError, Validator } from '../../utils'

// 每个bucket生成一个client
const clientPool = {}
const qiniuCtrl = {}

const validateConfig = {
  bucket: {
    type: 'string',
    message: {
      type: 'bucket字段必须是字符串类型'
    }
  },
  accessKey: {
    type: 'string',
    required: true,
    message: '未找到accessKey配置'
  },
  secretKey: {
    type: 'string',
    required: true,
    message: '未找到secretKey配置'
  },
  avaliableBuckets: {
    type: 'array',
    required: true,
    validate: val => !!val.length,
    message: {
      required: '未找到可用的bucket配置',
      validate: '未找到可用的bucket配置'
    }
  }
}
const validator = new Validator(validateConfig)

/**
 * @desc 获取七牛API客户端
 * @param  {String} bucket=''
 * @param  {Object} config={}
 */
function getClient (bucket = '', config = {}) {
  if (!bucket) {
    return null
  }
  let client = clientPool[bucket]
  if (!client) {
    client = qn.create({
      ...config,
      bucket
    })
  }
  return client
}

/**
 * @desc 更新七牛API客户端
 * @param  {String} bucket=''
 * @param  {Object} config={}
 */
export const updateClient = (bucket = '', config = {}) => {
  const result = { success: true, message: '' }
  try {
    clientPool[bucket] = qn.create({
      ...config,
      bucket
    })
  } catch (err) {
    logger.error(err)
    result.success = false
    result.message = err.message
  }
  return result
}

/**
 * @desc 获取七牛云配置
 * @param {String} [optional] bucket          七牛云的数据库名称
 */
qiniuCtrl.GET = async (ctx, next) => {
  let bucket = ctx.query.bucket
  const qiniuConfig = config.thirdParty.qiniu

  const { success, message } = validator.validate({
    bucket,
    ...qiniuConfig
  })
  if (!success) {
    return handleError({ ctx, message })
  }
  
  let { defaultBucket, avaliableBuckets, origin, uploadUrl } = qiniuConfig

  if (!defaultBucket) {
    // 如果未设置默认，则选可选列表的第一个
    defaultBucket = avaliableBuckets[0]
  }
  if (bucket) {
    if (!avaliableBuckets.includes(bucket)) {
      return handleError({ ctx, message: `${bucket}不在白名单` })
    }
  } else {
    bucket = defaultBucket
  }

  const client = getClient(bucket, qiniuConfig)

  if (!client) {
    return handleError({ ctx, message: '获取七牛云配置失败' })
  }

  handleSuccess({
    ctx,
    message: '获取七牛云配置成功',
    data: {
      uptoken: client.uploadToken(),
      bucket,
      domain: qiniuConfig.origin,
      uploadUrl: qiniuConfig.uploadUrl
    }
  })
}

export default async (ctx, next) => await handleRequest({ ctx, next, type: qiniuCtrl })
