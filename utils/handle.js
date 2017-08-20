/**
 * 处理请求响应
 * @author Jooger
 */

const { METHOD_NOT_ALLOWED, FAILED } = config.server.code

export async function handleRequest ({ ctx, type, next }) {
  const method = ctx.method
  const support = !!type[method]
  if (support) {
    await type[method](ctx, next)
  } else {
    handleError({ ctx, message: `${ctx.path}不支持${method}请求类型` })
  }
}

export function handleSuccess ({ ctx, message = '请求成功', data = {} }) {
  logger.info(message)
  ctx.success({
    message,
    data: data || {}
  })
}

export function handleError ({ ctx, message = '请求失败', err = {} }, end = false) {
  logger.error(message)
  Object.keys(err).length && console.error(err)
  !end && ctx.failed({
    message,
    error: err || {}
  })
}