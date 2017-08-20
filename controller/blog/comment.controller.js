/**
 * @desc 评论处理
 * @author Jooger
 */

import geoip from 'geoip-lite'
import { handleRequest, handleSuccess, handleError, isObjectId, isEmail, getAkismetClient, isType, marked, sendMail } from '../../utils'
import { CommentModel, ArticleModel, MessageModel, OptionModel } from'../../model'

const commentCtrl = { list: {}, item: {} }
const LINK = `${config.server.protocol}://blog.jooger.me`

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
  comment.meta.location = location || ''
  comment.meta.ip = ip
  comment.meta.agent = req.headers['user-agent'] || comment.agent
  
  // 先判断是不是垃圾邮件
  const akismetClient = getAkismetClient(LINK)
  const permalink = `${LINK}/${type == 0 ? `article/${pageId}` : 'guestbook'}`
  let isSpam = false
  if (akismetClient) {
    isSpam = await akismetClient.checkSpam({
      user_ip : ip,              // Required! 
      user_agent : comment.meta.agent,    // Required! 
      referrer : req.headers.referer,          // Required! 
      permalink,
      comment_type : type == 0 ? '文章评论' : '站内留言',
      comment_author : author.name,
      comment_author_email : author.email,
      comment_author_url : author.site,
      comment_content : content,
      is_test : process.env.NODE_ENV === 'development'
    })
  }
  
  const { ips, emails, forbidWords } = config.blog.blacklist
  const inBlackList = !!(ips.includes(ip) || emails.includes(author.email) || (forbidWords.length && eval(`/${forbidWords.join('|')}/gi`).test(cotent)))
  const { black, spam, message } = await checkComment(comment, isSpam, inBlackList)

  if (black || spam) {
    return handleSuccess({ ctx, message })
  }

  comment.renderedContent = marked(content)
  
  if (parent && !forward) {
    comment.forward = parent
  } else if (forward && !parent) {
    comment.parent = forward
  }

  let data = await new CommentModel(comment)
    .save()
    .catch(err => {
      handleError({ ctx, err, message: '评论发布失败'})
    })

  if (data) {
    data = await CommentModel.findById(data._id)
    .populate({ path: 'forward', select: 'author.name author.email' })
    .populate({ path: 'parent', select: 'author.name author.email' })
    .exec().catch(err => {
      handleError({ ctx, err, message: '评论发布失败'})
    })
    handleSuccess({ ctx, data, message: '评论发布成功' })
    // 生成站内消息
    generateMessage(data)
    // 如果是文章评论，则更新文章评论数量
    updateArticleCommentCount([comment.pageId])
    // 发送邮件给评论发布人及博主
    await sendEmailToAdminAndUser(data, permalink)
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

// 修改评论
commentCtrl.item.PUT = async (ctx, next) => {
  const { id } = ctx.params
  const comment = ctx.request.body
  const { content } = comment
  if (!isObjectId(id)) {
    return handleError({ ctx, message: '缺少评论id' })
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

// 评论状态修改 （已读|未读）
commentCtrl.item.PATCH = async (ctx, next) => {
  const { id } = ctx.params
  const { state } = ctx.request.body
  
  if (!isObjectId(id)) {
    return handleError({ ctx, message: '缺少评论id' })
  }

  if (!['-2', '-1', '0', '1', -2, -1, 0, 1].includes(state)) {
    return handleError({ ctx, message: '未知的评论状态' })
  }

  const _c = await CommentModel.findById(id).exec().catch(err => logger.error(err.message))

  if (_c) {
    if (_c.state === -2 && state != -2) {
      // 垃圾评论转为正常评论
      if (_c.akimetSpam) {
        // TODO: 报告给Akismet
      }
    } else if (_c.state !== -2 && state == -2) {
      // 正常评论转为垃圾评论
      if (!_c.akimetSpam) {
        // TODO: 报告给Akismet
      }
    }
  }

  const comment = await CommentModel.findByIdAndUpdate(id, { $set: { state } }, { new: true })
    .exec()
    .catch(err => handleError({ ctx, err, message: '评论状态更改失败' }))
  
  handleSuccess({ ctx, message: '评论状态更改成功' })
}

// 删除单条评论
commentCtrl.item.DELETE = async (ctx, next) => {
  const { id } = ctx.params
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
function updateArticleCommentCount (article_ids = []) {
  if (!article_ids.length) {
    return
  }
  article_ids = [...new Set(article_ids)].filter(id => isObjectId(id))
  CommentModel.aggregate([
    { $match: { state: 1, pageId: { $in: article_ids } } },
    { $group: { _id: '$pageId', total_count: { $sum: 1 } } }
  ])
  .exec()
  .then(counts => {
    counts.forEach(count => {
      ArticleModel.update(
        { _id: count._id },
        { $set: { 'meta.comments': count.total_count } }
      ).exec().catch(err => {
        logger.warn(`文章评论数量更新失败， err: ${err}`)
      })
    })
  }).catch(err => {
    logger.warn(`更新文章评论数量前聚合评论数据操作失败， err: ${err}`)
  })
}

// TODO: 发送邮件
async function sendEmailToAdminAndUser (comment, permalink) {
  const { type, pageId } = comment
  let adminTitle = '博客有新的留言'
  if (type == 0) {
    // 文章评论
    const article = await ArticleModel.findById(pageId).exec()
    if (article && article._id) {
      adminTitle = `博客文章 [${article.title}] 有了新的评论`
    }
  }
  sendMail({
    subject: adminTitle,
    text: `来自 ${comment.author.name} 的${type == 0 ? '评论' : '留言'}：${comment.content}`,
    html: `<p>来自 ${comment.author.name} 的${type == 0 ? '评论' : '留言'} <a href="${permalink}" target="_blank">[ 点击查看 ]</a>：${comment.renderedContent}</p>`
  }, true)

  if (comment.forward) {
    sendMail({
      to: comment.forward.author.email,
      subject: '你在Jooger的博客的评论有了新的回复',
      text: `来自 ${comment.author.name} 的回复：${comment.content}`,
      html: `<p>来自 ${comment.author.name} 的回复 <a href="${permalink}" target="_blank">[ 点击查看 ]</a>：${comment.renderedContent}</p>`
    })
  }
}

// 检测评论
async function checkComment (comment, isSpam, inBlackList) {
  const { commentSpamLimit, blacklist: { ips, emails, forbidWords } } = config.blog
  const result = { black: inBlackList, spam: isSpam, message: '' }

  if (inBlackList) {
    // 在黑名单
    result.message = '你在黑名单中，该评论不会显示'
  } else if (isSpam) {
    // 不在黑名单 && 垃圾邮件
    comment.state = -2
    comment.akimetSpam = true
    // 该用户历史垃圾评论次数
    let spamCount = await CommentModel.count({
      akimetSpam: true,
      'author.name': comment.author.name,
      'author.email': comment.author.email
    })
    .exec()
    .catch(() => (spamCount = 0))
    if (spamCount >= commentSpamLimit) {
      // 达到规定的垃圾评论最大次数
      result.black = true
      result.message = '你在黑名单中，该评论不会显示'
      // 拉入黑名单
      await OptionModel.findOneAndUpdate({}, {
        blacklist: {
          ips: ips.concat(ip),
          emails: emails.concat(comment.author.email),
          forbidWords
        }
      })
    } else {
      result.message = '检测到垃圾评论，该评论不会显示'
    }
  } else {
    // 不在黑名单 && 不是垃圾邮件
    result.message = '正常评论'
  }

  return result
}

// 生成站内消息
function generateMessage (comment) {
  let atMe = false
  let replyMe = false
  let title = comment.type == 0 ? '发布评论' : '发布留言'

  if (comment.forward && comment.forward.author.name === config.info.author) {
    // 回复我的评论
    replyMe = true
  }
  
  // TODO: 解析comment的content，看是否@了我
  //
  //

  if (replyMe) {
    title = '回复了我'
  }
  if (atMe) {
    title += '，并且@了我'
  }
  new MessageModel({
    title,
    type: parseInt('' + ~~replyMe + ~~atMe, 2),
    comment: comment._id
  })
  .save()
  .catch(err => logger.error(err.message))
}

export default {
  list: async (ctx, next) => await handleRequest({ ctx, next, type: commentCtrl.list }),
  item: async (ctx, next) => await handleRequest({ ctx, next, type: commentCtrl.item })
}
