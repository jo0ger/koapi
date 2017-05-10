/**
 * 评论controller
 */

// const geoip = require('geoip-lite')
const { 
  handle: { handleRequest, handleSuccess, handleError },
  validate: { isEmail, isObjectId },
  marked
} = require('../util')
const config = require('../config')
const authIsVerified = require('../middleware/auth')
const { CommentModel, ArticleModel } = require('../model')
const commentCtrl = { list: {}, item: {} }

// 获取评论列表
// 当state = 1时，获取
commentCtrl.list.GET = async (ctx, next) => {
  // sort 排序 0 时间倒序 1 时间正序 2 点赞数倒序
  // type 评论获取方式 0 平铺 1 盖楼
  let { page, page_size, state, keyword, page_id, sort = 0, start_date, end_date, format = 0 } = ctx.query

  const isVerified = await authIsVerified(ctx)

  // 过滤条件
  const options = {
    sort: { create_at: 1 },
    page: Number(page || 1),
    limit: Number(page_size || config.BLOG.COMMENT_LIMIT),
    lean: true,
    select: '-type -page_id',
    populate: [
      { path: 'forward', select: 'author.name' }
    ]
  }

  if ([0, 1, '0', '1'].includes(sort)) {
    options.sort = { create_at: sort == 0 ? -1 : 1 }
  } else if (sort == 2) {
    options.sort = { likes: -1 }
  }

  // 评论查询条件
  let query = {}

  // 如果是盖楼模式，先查询父级评论
  if (format == 1) {
    query.parent_id = { $exists: false }
  }

  if (page_id) {
    query.page_id = page_id
  }

  // 评论状态
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
  

  // 如果未通过权限校验，将评论状态重置为1，并且不返回content
  if (!isVerified) {
    query.state = 1
    options.select += '-content'
  }

  let parents = await CommentModel.paginate(query, options).catch(err => {
    handleError({ ctx, err, message: '评论列表获取失败' })
  })

  let parentComments = parents.docs
  let total = parentComments.length

  if (!isVerified) {
    let { state, page_id, parent_id } = query
    let noPaginationQuery = { state }
    if (page_id) {
      noPaginationQuery.page_id = page_id
    }
    if (format === 1) {
      noPaginationQuery.parent_id = parent_id
    }
    let totalComments = await CommentModel.find(noPaginationQuery).sort(options.sort)
    for (let i = 0; i < parentComments.length; i++) {
      let parent = parentComments[i]
      const floor = totalComments.findIndex(item => item._id.toString() === parent._id.toString())
      parent.floor = floor + 1
      if (parent.forward) {
        const forwardFloor = totalComments.findIndex(item => item._id.toString() === parent.forward._id.toString())
        parent.forward.floor = forwardFloor + 1
      }
    }

  }

  // format===1时，盖楼模式
  if (format === 1) {
    // 迭代子评论
    let childComments = []
    for (let i = 0; i < parentComments.length; i++) {
      let parent = parentComments[i]
      childComments = await CommentModel.find({
        parent_id: parent._id
      })
      .sort('-create_at')
      .exec()
      .catch(err => {
        handleError({ ctx, err, message: '评论列表获取失败' })
      })
      childComments = childComments.map(child => {
        child = child.toObject()
        if (child.state !== 1 && !isVerified) {
          delete child.content
          delete child.rendered_content
        }
        return child
      })
      total += childComments.length
      parent.children = childComments
    }
  }
  
  handleSuccess({
    ctx,
    message: '评论列表获取成功',
    data: {
      list: parentComments,
      pagination: {
        total: parents.total,
        current_page: parents.page,
        total_page: parents.pages,
        per_page: parents.limit
      }
    }
  })
}

// 发布评论
commentCtrl.list.POST = async (ctx, next) => {
  let req = ctx.request
  let comment = req.body
  let { content, author = {}, type, page_id, parent_id, forward_id } = comment
  if (typeof author === 'string') {
    author = JSON.parse(author)
    comment.author = author
  }
  let { name, email, site } = author

  // 校验
  if (![0, 1, '0', '1'].includes(type) || !page_id) {
    return handleError({ ctx, message: '少侠，您在哪个页面评论的？' })
  }
  if (!content) {
    return handleError({ ctx, message: '少侠，留下您的回复' })
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
  comment.meta = comment.meta || {}
  if (ip_location) {
    comment.meta.ip_location = ip_location
  }
  comment.meta.ip = ip
  comment.meta.agent = req.headers['user-agent'] || comment.agent
  comment.rendered_content = marked(content)
  if (parent_id && !forward_id) {
    comment.forward_id = parent_id
  } else if (forward_id && !parent_id) {
    comment.parent_id = forward_id
  }

  let data = await new CommentModel(comment)
    .save()
    .catch(err => {
      handleError({ ctx, err, message: '评论发布失败'})
    })
  if (data) {
    handleSuccess({ ctx, data, message: '评论发布成功' })
  }
  if (data && data.type === 0 && data.page_id) {
    // 如果是文章评论，则更新文章评论数量
    await updateArticleCommentCount([comment.page_id])
  }
}

// 批量修改state
commentCtrl.list.PATCH = async (ctx, next) => {
  let { comment_ids, article_ids, state } = ctx.request.body
  if (!comment_ids || !comment_ids.length) {
    return handleError({ ctx, message: '未选中评论' })
  }
  let update = {}
  if ([-2, -1, 0, 1, '-2', '-1', '0', '1'].includes(state)) {
    update.state = Number(state)
  }
  let data = await CommentModel.update({ _id: { $in: comment_ids }}, { $set: update }, { multi: true })
    .exec()
    .catch(err => {
      handleError({ ctx, err, message: '评论批量操作失败' })
    })
  handleSuccess({ ctx, data, message: '评论批量操作成功'})
  if (article_ids && article_ids.length) {
    updateArticleCommentCount(article_ids)
  }
}

// 批量删除评论
commentCtrl.list.DELETE = async (ctx, next) => {
  let { comment_ids, article_ids } = ctx.request.body
  if (!comment_ids || !comment_ids.length) {
    return handleError({ ctx, message: '未选中评论' })
  }
  let data = await CommentModel.remove({ _id: { $in: comment_ids } }).exec()
    .catch(err => {
      handleError({ ctx, err, message: '评论批量删除失败' })
    })
  handleSuccess({ ctx, message: '评论批量删除成功' })
  if (article_ids && article_ids.length) {
    updateArticleCommentCount(article_ids)
  }
}

// 获取单条评论详情，主要是查看该条评论的对话详情列表
commentCtrl.item.GET = async (ctx, next) => {
  const isVerified = await authIsVerified(ctx)
  let { id } = ctx.params
  if (!isObjectId(id)) {
    return handleError({ ctx, message: '缺少评论id' })
  }
  let query = { _id: id }
  if (!isVerified) {
    query.state = 1
  }
  // 为该comment生成forward链
  // 如果某一级forward的state!==1，把content和rendered_content去掉
  const generateForwardComment = async (forward_id = '', isVerified = false) => {
    if (!forward_id) {
      return null
    }
    let Query = CommentModel.findById(forward_id)
    if (!isVerified) {
      Query = Query.select('-content -page_id -id -type -sticky -update_at')
    }
    let forward = await Query.exec()
    forward = forward && forward.toObject() || null
    if (forward) {
      if (forward.forward) {
        forward.forward = await generateForwardComment(forward.forward, isVerified)
      }
      // 如果在前台获取，且评论未审核通过，获取详情的时候不返回内容
      if (forward.state !== 1 && !isVerified) {
        delete forward.content
        delete forward.rendered_content
        delete forward.state
      }
    }
    return forward
  }

  let Query = CommentModel.findOne(query).populate('forward')

  // 前台获取详情不需要content
  if (!isVerified) {
    Query = Query.select('forward rendered_content')
  }

  let data = await Query
    .exec()
    .catch(err => {
      handleError({ ctx, err, message: '评论详情获取失败' })
    })
  data = data && data.toObject() || null
  if (data) {
    data.forward = await generateForwardComment(data.forward._id, isVerified)
  }
  handleSuccess({ ctx, data, message: '评论详情获取成功' })
}

commentCtrl.item.PUT = async (ctx, next) => {
  let { id } = ctx.params
  let comment = ctx.request.body
  let { content } = comment
  if (!isObjectId(id)) {
    return handleError({ ctx, message: '缺少文章id' })
  }
  if (!content) {
    return handleError({ ctx, message: '少侠，留下您的回复' })
  }
  comment.rendered_content = marked(content)
  let data = await CommentModel.findByIdAndUpdate(id, comment, { new: true })
    .exec()
    .catch(err => {
      handleError({ ctx, err, message: '评论修改失败' })
    })
  handleSuccess({ ctx, data, message: '评论修改成功' })
  if (data && data.type === 0 && data.page_id) {
    await updateArticleCommentCount([data.page_id])
  }
}

// 删除单条评论
commentCtrl.item.DELETE = async (ctx, next) => {
  let { id } = ctx.params
  if (!isObjectId(id)) {
    return handleError({ ctx, message: '缺少评论id' })
  }
  await CommentModel.findByIdAndRemove(id).exec()
    .then(data => {
      handleSuccess({ ctx, data, message: '删除评论成功' })
    })
    .catch(err => {
      handleError({ ctx, err, message: '删除评论失败' })
    })
}

// 更新文章的meta.comments评论数量
async function updateArticleCommentCount (article_ids = []) {
  if (!article_ids.length) {
    return
  }
  article_ids = [...new Set(article_ids)].filter(id => isObjectId(id))
  let counts = await CommentModel.aggregate([
    { $match: { state: 1, page_id: { $in: article_ids } } },
    { $group: { _id: '$page_id', total_count: { $sum: 1 } } }
  ]).exec().catch(err => {
    logger.warn(`更新文章评论数量前聚合评论数据操作失败， err: ${err}`)
  })
  counts.forEach(count => {
    ArticleModel.update(
      { _id: count._id },
      { $set: { 'meta.comments': count.total_count } }
    ).exec().catch(err => {
      logger.warn(`文章评论数量更新失败， err: ${err}`)
    })
  })
}

module.exports = {
  list: async (ctx, next) => await handleRequest({ ctx, next, type: commentCtrl.list }),
  item: async (ctx, next) => await handleRequest({ ctx, next, type: commentCtrl.item })
}
