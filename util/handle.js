/**
 * 处理请求响应
 */

const config = require('../config')
const { METHOD_NOT_ALLOWED } = config.SERVER.CODE

export function handleRequest ({ ctx, type }) {
  const method = ctx.request.method
  const support = !!type[method]
  if (support) {
    type[method](ctx.request, ctx.response)
  } else {
    let message = `不支持${method}请求类型`
    logger.info(message)
    ctx.send(METHOD_NOT_ALLOWED, {
      code: FAILED,
      message
    })
  }
}

export function handleSuccess ({ ctx, message = '请求成功', data = {} }) {
  logger.info(message)
  ctx.success({
    message,
    data
  })
}

export function handleError ({ ctx, message = '请求失败', error = {} }) {
  logger.error(message)
  ctx.failed({
    message,
    error
  })
}