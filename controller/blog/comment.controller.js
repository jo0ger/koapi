/**
 * @desc 评论处理
 * @author Jooger
 */

import geoip from 'geoip-lite'
import { handleRequest, handleSuccess, handleError, isObjectId, isEmail, getAkismetClient } from '../../utils'
import { CommentModel, ArticleModel } from'../../model'
const commentCtrl = { list: {}, item: {} }

// 获取评论列表
// 当state = 1时，获取
commentCtrl.list.GET = async (ctx, next) => {
  // sort 排序 0 时间倒序 1 时间正序 2 点赞数倒序
  // format 评论获取方式 0 平铺 1 盖楼
  const { page, pageSize, state, keyword, pageId, sort = 0, startDate, endDate, format = 0 } = ctx.query


  // 过滤条件
  const options = {
    sort: { createAt: 1 },
    page: Number(page || 1),
    limit: Number(pageSize || config.blog.commentlimit),
    lean: true,
    select: '-type -pageId',
    populate: [
      { path: 'forward', select: 'author.name' }
    ]
  }

  if ([0, 1, '0', '1'].includes(sort)) {
    options.sort = { createAt: sort == 0 ? -1 : 1 }
  } else if (sort == 2) {
    options.sort = { ups: -1 }
  }

  // 评论查询条件
  const query = {}

  // 如果是盖楼模式，先查询父级评论
  if (format == 1) {
    query.parent = { $exists: false }
  }

  if (pageId) {
    query.pageId = pageId
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
  

  // 如果未通过权限校验，将评论状态重置为1，并且不返回content
  if (!ctx._verify) {
    query.state = 1
    options.select += '-content'
  }

  const parents = await CommentModel.paginate(query, options).catch(err => {
    handleError({ ctx, err, message: '评论列表获取失败' })
  })

  const parentComments = parents.docs
  const total = parentComments.length

  if (!ctx._verify) {
    const { state, pageId, parent } = query
    const noPaginationQuery = { state }
    if (pageId) {
      noPaginationQuery.pageId = pageId
    }
    if (format === 1) {
      noPaginationQuery.parent = parent
    }
    const totalComments = await CommentModel.find(noPaginationQuery).sort(options.sort)
    for (let i = 0; i < parentComments.length; i++) {
      const parent = parentComments[i]
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
      childComments = await CommentModel.find({ parent: parent._id })
      .sort('-createAt')
      .exec()
      .catch(err => {
        handleError({ ctx, err, message: '评论列表获取失败' })
      })
      childComments = childComments.map(child => {
        child = child.toObject()
        if (child.state !== 1 && !ctx._verify) {
          delete child.content
          delete child.renderedContent
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
  const comment = ctx.request.body
  const req = ctx.req
  const { content, author = {}, type, pageId, parent, forward } = comment
  if (isType(author, 'String')) {
    try {
      author = JSON.parse(author)
    } catch (err) {
      logger.error(err)
      author = {}
    }
  }
  comment.author = author
  const { name, email, site } = author

  // 校验
  if (![0, 1, '0', '1'].includes(type) || !pageId) {
    return handleError({ ctx, message: '少侠，你在哪个页面评论的？' })
  }
  if (!content) {
    return handleError({ ctx, message: '少侠，留下你的回复' })
  }
  if (!name || !email) {
    return handleError({ ctx, message: '少侠，报上姓名和邮箱' })
  } else if (!isEmail(email)) {
    return handleError({ ctx, message: '少侠，你的邮箱格式错了' })
  }

  // 获取ip
  const ip = (req.headers['x-forwarded-for'] || 
              req.headers['x-real-ip'] || 
              req.connection.remoteAddress || 
              req.socket.remoteAddress ||
              req.connection.socket.remoteAddress ||
              req.ip ||
              req.ips[0]).replace('::ffff:', '')
  const location = geoip.lookup(ip)
  comment.meta = comment.meta || {}
  if (location) {
    comment.meta.location = location
  }
  comment.meta.ip = ip
  comment.meta.agent = req.headers['user-agent'] || comment.agent
  
  const akismetClient = getAkismetClient('blog.jooger.me')
  akismetClient && akismetClient.checkSpam({
    user_ip : ip,              // Required! 
    user_agent : comment.meta.agent,    // Required! 
    referrer : req.headers.referer,          // Required! 
    permalink : req.url,
    comment_type : type == 0 ? '文章评论' : '站内留言',
    comment_author : author.name,
    comment_author_email : author.email,
    comment_author_url : author.site,
    comment_content : content,
    is_test : process.env.NODE_ENV === 'development'
  }).then(isSpam => {
    const { ips, emails, keywords } = config.blog.blacklist
    const inBlackList = ips.includes(ip) || emails.includes(author.email) || eval(`/${keywords.join('|')}/gi`).test(cotent)
    if (isSpam) {
      // 垃圾评论
      comment.type = -2
      if (!inBlackList) {
        // TODO: 检查
      }
    } else {
      // 正常评论
      if (inBlackList) {

      }
    }
  })

  comment.renderedContent = marked(content)
  if (parent && !forward) {
    comment.forward = parent
  } else if (forward && !parent) {
    comment.parent = forward
  }

  const data = await new CommentModel(comment)
    .save()
    .catch(err => {
      handleError({ ctx, err, message: '评论发布失败'})
    })

  if (data) {
    if (data.type === 0 && data.pageId) {
      // 如果是文章评论，则更新文章评论数量
      await updateArticleCommentCount([comment.pageId])
      // TODO: 发送邮件给评论发布人
    }

    data = await CommentModel.findById(data._id)
      .select('-type -pageId')
      .populate({ path: 'forward', select: 'author.name' })
      .exec().catch(err => {
        handleError({ ctx, err, message: '评论发布失败'})
      })
    handleSuccess({ ctx, data, message: '评论发布成功' })
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
  let { id } = ctx.params
  if (!isObjectId(id)) {
    return handleError({ ctx, message: '缺少评论id' })
  }
  let query = { _id: id }
  if (!ctx._verify) {
    query.state = 1
  }
  // 为该comment生成forward链
  // 如果某一级forward的state!==1，把content和renderedContent去掉
  const generateForwardComment = async (forward_id = '') => {
    if (!forward_id) {
      return null
    }
    let Query = CommentModel.findById(forward_id)
    if (!ctx._verify) {
      Query = Query.select('-content -pageId -id -type -sticky -updateAt')
    }
    let forward = await Query.exec()
    forward = forward && forward.toObject() || null
    if (forward) {
      if (forward.forward) {
        forward.forward = await generateForwardComment(forward.forward)
      }
      // 如果在前台获取，且评论未审核通过，获取详情的时候不返回内容
      if (forward.state !== 1 && !ctx._verify) {
        delete forward.content
        delete forward.renderedContent
        delete forward.state
      }
    }
    return forward
  }

  let Query = CommentModel.findOne(query).populate('forward')

  // 前台获取详情不需要content
  if (!ctx._verify) {
    Query = Query.select('forward renderedContent')
  }

  const data = await Query
    .exec()
    .catch(err => {
      handleError({ ctx, err, message: '评论详情获取失败' })
    })
  data = data && data.toObject() || null
  if (data) {
    data.forward = await generateForwardComment(data.forward._id)
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
  comment.renderedContent = marked(content)
  let data = await CommentModel.findByIdAndUpdate(id, comment, { new: true })
    .exec()
    .catch(err => {
      handleError({ ctx, err, message: '评论修改失败' })
    })
  handleSuccess({ ctx, data, message: '评论修改成功' })
  if (data && data.type === 0 && data.pageId) {
    await updateArticleCommentCount([data.pageId])
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
    { $match: { state: 1, pageId: { $in: article_ids } } },
    { $group: { _id: '$pageId', total_count: { $sum: 1 } } }
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

export default {
  list: async (ctx, next) => await handleRequest({ ctx, next, type: commentCtrl.list }),
  item: async (ctx, next) => await handleRequest({ ctx, next, type: commentCtrl.item })
}
