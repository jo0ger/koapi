/**
 * @desc 消息处理
 * @author Jooger
 * @email zzy1198258955@163.com
 * @date 20 Aug 2017
 */

import { handleRequest, handleSuccess, handleError, isObjectId } from '../../utils'
import { MessageModel } from '../../model'

const messageCtrl = {
  list: {},
  item: {}
}

// 消息列表获取
messageCtrl.list.GET = async (ctx, next) => {
  const { page, pageSize, state, type, startDate, endDate } = ctx.query

  if (!ctx._verify) {
    return handleError({ ctx, message: '消息需要登录后才能查看' })
  }

  // 过滤条件
  const options = {
    sort: { createAt: -1 },
    page: Number(page || 1),
    limit: Number(pageSize || 20),
    populate: [
      { path: 'comment', select: 'name description extends' }
    ]
  }

  // 消息查询条件
  const query = {}
  
  // 消息状态
  if (['0', '1', 0, 1].includes(state)) {
    query.state = state
  }

  // 消息类型
  if (['0', '1', '2', '3', 0, 1, 2, 3].includes(type)) {
    query.type = type
  }

  // 起始日期
  if (startDate) {
    const $gte = new Date(startDate)
    if ($gte.toString() !== 'Invalid Date') {
      query.createAt = { $gte }
    }
  }

  // 结束日期
  if (endDate) {
    const $lte = new Date(endDate)
    if ($lte.toString() !== 'Invalid Date') {
      query.createAt = Object.assign({}, query.createAt, { $lte })
    }
  }

  const messages = await MessageModel.paginate(query, options)
    .catch(err => handleError({ ctx, err, message: '消息列表获取失败' }))

  handleSuccess({
    ctx,
    message: '消息列表获取成功',
    data: {
      list: messages.docs,
      pagination: {
        totalCount: messages.total,
        currentPage: messages.page > messages.pages ? messages.pages : messages.page,
        totalPage: messages.pages,
        pageSize: messages.limit
      }
    } 
  })
}

// // 消息列表生成
// messageCtrl.list.POST = async (ctx, next) => {}

// 消息详情获取
messageCtrl.item.GET = async (ctx, next) => {
  const { id } = ctx.params

  if (!ctx._verify) {
    return handleError({ ctx, message: '消息需要登录后才能查看' })
  }

  if (!isObjectId(id)) {
    return handleError({ ctx, message: '缺少消息id' })
  }

  const message = await MessageModel.findById(id)
    .populate('comment')
    .exec()
    .catch(err => handleError({ ctx, err, message: '消息详情获取失败' }))
  handleSuccess({ ctx, data: message, message: '消息详情获取成功' })
}

// 消息状态修改 （已读|未读）
messageCtrl.item.PATCH = async (ctx, next) => {
  const { id } = ctx.params
  const { state } = ctx.request.body

  if (!isObjectId(id)) {
    return handleError({ ctx, message: '缺少消息id' })
  }

  if (!['0', '1', 0, 1].includes(state)) {
    return handleError({ ctx, message: '未知的消息状态' })
  }

  const message = await MessageModel.findByIdAndUpdate(id, { $set: { state } }, { new: true })
    .populate('comment')
    .exec()
    .catch(err => handleError({ ctx, err, message: '消息状态更改失败' }))
  
  handleSuccess({ ctx, message: state == 0 ? '消息标记位未读' : '消息标记位已读' })
}

// 消息删除
messageCtrl.item.DELETE = async (ctx, next) => {
  const { id } = ctx.params

  if (!isObjectId(id)) {
    return handleError({ ctx, message: '缺少消息id' })
  }

  await MessageModel.findByIdAndRemove(id).exec()
    .catch(err => handleError({ ctx, err, message: '消息删除失败' }))

  handleSuccess({ ctx, message: '消息删除成功' })
}

export default {
  list: async (ctx, next) => await handleRequest({ ctx, next, type: messageCtrl.list }),
  item: async (ctx, next) => await handleRequest({ ctx, next, type: messageCtrl.item })
}
