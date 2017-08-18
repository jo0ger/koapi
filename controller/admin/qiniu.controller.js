/**
 * 七牛获取上传配置
 */

import qn from 'qn'
import { handleRequest, handleSuccess, handleError, Validator, isType } from '../../utils'

const qiniuCtrl = {}
// 每个bucket生成一个client
let clientPool = {}

const validateConfig = {
  bucket: {
    type: 'string',
    required: true,
    message: {
      type: 'bucket字段必须是字符串类型',
      required: '未知的bucket'
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
    try {
      clientPool[bucket] = client = qn.create({
        ...config,
        bucket
      })
    } catch (err) {
      logger.error(err)
      return null
    }
  }
  return client
}
/**
 * 获取指定的bucket的对应的API客户端配置
 * @param  {String} bucket=''
 * @param  {Object} config={}
 */
function getClientConfig (bucket = '', config = {}) {
  if (!bucket) {
    return null
  }
  const { secretKey, accessKey, avaliableBuckets } = config
  const bucketConfig = avaliableBuckets.find(item => item.name === bucket)
  if (!bucketConfig) {
    return null
  }
  return {
    secretKey,
    accessKey,
    bucket,
    origin: bucketConfig.origin,
    uploadUrl: bucketConfig.uploadUrl
  }
}

/**
 * @desc 更新七牛API客户端
 * @param  {String} bucket=''
 * @param  {Object} config={}
 */
export const updateQiniuClient = (config = {}) => {
  const result = { success: true }
  try {
    clientPool = {}
    config.avaliableBuckets.forEach(bucket => {
      clientPool[bucket] = qn.create(getClientConfig(bucket, config))
    })
    logger.info('七牛云API客户端更新成功')
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
    ...qiniuConfig,
    bucket
  })
  if (!success) {
    return handleError({ ctx, message })
  }
  
  let { secretKey, accessKey, defaultBucket, avaliableBuckets } = qiniuConfig

  if (!defaultBucket && avaliableBuckets.length) {
    // 如果未设置默认，则选可选列表的第一个
    defaultBucket = avaliableBuckets[0]
  }

  const clientConfig = getClientConfig(bucket, qiniuConfig)
  if (!clientConfig) {
    return handleError({ ctx, message: `未找到${bucket}的配置` })
  }

  const client = getClient(bucket, clientConfig)

  if (!client || !isType(client.uploadToken, 'Function')) {
    return handleError({ ctx, message: '获取七牛云配置失败' })
  }

  handleSuccess({
    ctx,
    message: '获取七牛云配置成功',
    data: {
      uptoken: client.uploadToken(),
      bucket,
      origin: client.options.origin || client._baseURL,
      uploadUrl: client.options.uploadUrl || client._uploadURL
    }
  })
}

export default async (ctx, next) => await handleRequest({ ctx, next, type: qiniuCtrl })
