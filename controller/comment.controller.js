/**
 * 评论controller
 */

// const geoip = require('geoip-lite')
const { 
  handle: { handleRequest, handleSuccess, handleError },
  validate: { isEmail }
} = require('../util')
const config = require('../config')
const authIsVerified = require('../middleware/auth')
const { CommentModel, ArticleModel } = require('../model')
const commentCtrl = { list: {}, item: {} }

// 获取评论列表
commentCtrl.list.GET = async (ctx, next) => {
  // sort 排序 0 时间倒序 1 时间正序 2 点赞数倒序
  let { page, page_size, state, keyword, article_id, page_name, sort = 1, start_date, end_date } = ctx.query

  // 过滤条件
  const options = {
    sort: { create_at: 1 },
    page: Number(page || 1),
    limit: Number(page_size || config.SERVER.COMMENT_LIMIT)
  }

  if ([0, 1, '0', '1'].includes(sort)) {
    options.sort = { create_at: sort == 0 ? -1 : 1 }
  } else if (sort == 2) {
    options.sort = { likes: -1 }
  }

  // 文章查询条件
  let query = {
    // $exists: { parent_id: false }
  }

  // 文章状态
  if (['-2', '-1', '0', '1', -2, -1, 0, 1].includes(state)) {
    query.state = state
  }

  // 搜索关键词 方便后台查询
  if (keyword) {
    const keywordReg = new RegExp(keyword)
    query.$or = [
      { content:  keywordReg },
      { 'author.name':  keywordReg },
      { 'author.email':  keywordReg }
    ]
  }

  // 起始日期
  if (start_date) {
    const $gte = new Date(start_date)
    if ($gte.toString() !== 'Invalid Date') {
      query.create_at = { $gte }
    }
  }

  // 结束日期
  if (end_date) {
    const $lte = new Date(end_date)
    if ($lte.toString() !== 'Invalid Date') {
      query.create_at = Object.assign({}, query.create_at, { $lte })
    }
  }

  // 如果未通过权限校验，将文章状态重置为1
  if (!await authIsVerified(ctx)) {
    query.state = 1
  }

  let parentComments = (
    await CommentModel.paginate(query, options)
      .catch(err => {
        handleError({ ctx, err, message: '评论列表获取失败' })
      })
  ).docs

  let childComments = []
  let childState = query.state
  for (let i = 0, parent = parentComments[i]; i < parentComments.length; i++) {
    childComments = await CommentModel.find({
      parent_id: parent._id,
      state: childState
    })
    .sort({ create_at: -1 })
    .exec()
    .catch(err => {
      handleError({ ctx, err, message: '评论列表获取失败' })
    })
    parent.children = childComments
  }
  handleSuccess({
    ctx,
    message: '评论列表获取成功',
    data: {
      list: parentComments,
      pagination: {
        total: parentComments.total,
        current_page: parentComments.page,
        total_page: parentComments.pages,
        per_page: parentComments.limit
      }
    }
  })
    // .then(comments => {
    //   handleSuccess({
    //     ctx,
    //     message: '评论列表获取成功',
    //     data: {
    //       list: comments.docs,
    //       pagination: {
    //         total: comments.total,
    //         current_page: comments.page,
    //         total_page: comments.pages,
    //         per_page: comments.limit
    //       }
    //     } 
    //   })
    // })
    // .catch(err => {
    //   handleError({ ctx, err, message: '评论列表获取失败' })
    // })
}

// 发布评论
commentCtrl.list.POST = async (ctx, next) => {
  let req = ctx.request
  let comment = req.body
  let { content, author: { name, email }, article_id, page_name } = comment
  if (!article_id && !page_name) {
    return handleError({ ctx, message: '少侠，您在哪个页面评论的？' })
  }
  if (!content) {
    return handleError({ ctx, message: '少侠，您要评论啥？' })
  }
  if (!name || !email) {
    return handleError({ ctx, message: '少侠，报上姓名和邮箱' })
  } else if (!isEmail(email)) {
    return handleError({ ctx, message: '少侠，您的邮箱格式错了' })
  }
  // 获取ip
  const ip = (ctx.req.headers['x-forwarded-for'] || 
              ctx.req.headers['x-real-ip'] || 
              ctx.req.connection.remoteAddress || 
              ctx.req.socket.remoteAddress ||
              ctx.req.connection.socket.remoteAddress ||
              ctx.req.ip ||
              ctx.req.ips[0]).replace('::ffff:', '')
  // const ip_location = geoip.lookup(ip)
  const ip_location = 'Beijing'
  console.log(ip);
  console.log(ip_location);
  comment.meta = comment.meta || {}
  if (ip_location) {
    comment.meta.ip_location = ip_location
  }
  comment.meta.ip = ip
  comment.meta.agent = req.headers['user-agent'] || comment.agent
  comment.type = article_id ? 0 : 1

  let data = await new CommentModel(comment)
    .save()
    .catch(err => {
      handleError({ ctx, err, message: '评论发布失败'})
    })
  if (comment.article_id) {
    // 如果是文章评论，则更新文章评论数量
    await updateArticleCommentCount(comment.article_id)
  }
  handleSuccess({ ctx, data, message: '评论发布成功' })
}

commentCtrl.list.PATCH = async (ctx, next) => {}

commentCtrl.list.DELETE = async (ctx, next) => {}

commentCtrl.item.GET = async (ctx, next) => {}

commentCtrl.item.PUT = async (ctx, next) => {}

commentCtrl.item.DELETE = async (ctx, next) => {}

async function updateArticleCommentCount (article_id = '') {
  if (!article_id) {
    return
  }
  let count = await CommentModel.aggregate([
    { $match: { state: 1, article_id } },
    { $group: { _id: '$article_id', total_count: { $sum: 1 } } }
  ]).exec().catch(err => {
    logger.warn(`更新文章评论数量前聚合评论数据操作失败， err: ${err}`)
  })
  await ArticleModel.findByIdAndUpdate(
    count._id,
    { $set: { 'meta.count': count.total_count } }
  ).exec().catch(err => {
    logger.warn(`文章评论数量更新失败， err: ${err}`)
  })
}

module.exports = {
  list: async (ctx, next) => await handleRequest({ ctx, next, type: commentCtrl.list }),
  item: async (ctx, next) => await handleRequest({ ctx, next, type: commentCtrl.item })
}
