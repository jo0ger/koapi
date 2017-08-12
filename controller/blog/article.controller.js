/**
 * @desc 文章处理
 * @author Jooger
 */

import { handleRequest, handleSuccess, handleError, isObjectId, isType, marked, createObjectId } from '../../utils'
import config from '../../config'
import { ArticleModel, CategoryModel, TagModel, CommentModel } from '../../model'
import authIsVerified from '../../middleware/auth'
const articleCtrl = { list: {}, item: {} }

// 校验配置
const validateConfig = {
  id: {
    type: 'objectId',
    required: true,
    message: '文章ID不能为空'
  },
  title: {
    type: 'string',
    required: true,
    message: '文章标题不能为空'
  },
  content: {
    type: 'string',
    required: true,
    message: '文章内容不能为空'
  },
  tag: {
    type: 'array',
    required: true,
    validate (value) {
      return value.length > 1
    },
    message: {
      required: '标签不能为空',
      validate: '标签数组的长度最少为2'
    }
  }
}

/**
 * @desc 根据文章ID删除评论
 * @param  {String | Array[String]} id 文章id(数组)
 */
async function deleteCommentByArticleId (id) {
  if (id) {
    // 批量/单篇删除文章的时候删除评论
    await CommentModel.remove({ pageId: isType(id, 'array') ? { $in: id } : id }).exec()
  }
}

/**
 * @desc 获取文章列表
 * @type GET
 * @param {Number} [options] page                   请求列表页数 [默认 1]
 * @param {Number} [options] pageSize               每页文章数 [默认 10]
 * @param {Number} [options] state                  文章状态 [可选值 0 草稿 | 1 已发布]
 * @param {String} [options] keyword                搜索关键词 [匹配标题和简介]
 * @param {String} [options] category               分类 [分类id 或 分类name]
 * @param {String} [options] tag                    标签 [标签id 或 标签name]
 * @param {Date} [options] startDate                起始查询时间 eg. '2017-08-11'
 * @param {Date} [options] endDate                  结束查询时间 eg. '2017-08-11'
 * @param {Boolean} [options] hot                   热门文章查询
 * @param {String | Object} [options] sort          文章排序 [hot存在情况下， 忽略sort]
 */
articleCtrl.list.GET = async (ctx, next) => {
  // state => 0 || 1
  // sort => meta.ups: -1 || ...    方便后台列表排序 需要JSON序列化
  // hot => meta.comments: -1 && meta.ups: -1 && meta.pvs: -1
  const { page, pageSize, state, keyword, category, tag, startDate, endDate, hot, sort } = ctx.query

  // 过滤条件
  const options = {
    sort: { createAt: -1 },
    page: Number(page || 1),
    limit: Number(pageSize || config.BLOG.LIMIT),
    populate: [
      { path: 'category', select: 'name description extends' },
      { path: 'tag', select: 'name description extends' }
    ]
  }

  // 文章查询条件
  const query = {}

  // 文章状态
  if (['0', '1'].includes(state)) {
    query.state = state
  }

  // 搜索关键词
  if (keyword) {
    const keywordReg = new RegExp(keyword)
    query.$or = [
      { title:  keywordReg },
      { description:  keywordReg }
    ]
  }

  // 虽然hot可以放在sort里，但这里为了前台热门文章获取，单独列出hot
  // hot和sort二者只能存其一
  if (hot) {
    // hot 按照评论，点赞数，浏览量，创建时间进行倒序排序
    options.sort = {
      'meta.comments': -1,
      'meta.ups': -1,
      'meta.pvs': -1,
      createAt: -1
    }
    options.select = 'title createAt meta tag thumb'
  } else if (sort) {
    // sort 排序
    try {
      options.sort = isType(sort, 'string') ? JSON.parse(sort) : sort
    } catch (err) {
      logger.error(err)
    }
    options.sort.createAt = options.sort.createAt || -1
  }

  // 分类查询
  if (category) {
    // 如果是id
    if (isObjectId(category)) {
      query.category = category
    } else {
      // 普通字符串，需要先查到id
      await CategoryModel.findOne({ name: category }).exec()
        .then(c => {
          query.category = c && c._id || createObjectId()
        })
        .catch(err => {
          logger.error('分类查找失败')
          query.category = createObjectId()
        })
    }
  }

  // 标签查询
  if (tag) {
    // 如果是id
    if (isObjectId(tag)) {
      query.tag = tag
    } else {
      // 普通字符串，需要先查到id
      await TagModel.findOne({ name: tag }).exec()
        .then(t => {
          query.tag = t && t._id || createObjectId()
        })
        .catch(() => {
          logger.error('标签查找失败')
          query.tag = createObjectId()
        })
    }
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

  // 未通过权限校验（前台获取文章列表）
  if (!ctx._verify) {
    query.state = 1 // 将文章状态重置为1
    options.select = '-content -renderedContent -state' // 文章列表不需要content和state
  }

  await ArticleModel.paginate(query, options)
    .then(articles => {
      handleSuccess({
        ctx,
        message: '文章列表获取成功',
        data: {
          list: articles.docs,
          pagination: {
            totalCount: articles.total,
            currentPage: articles.page > articles.pages ? articles.pages : articles.page,
            totalPage: articles.pages,
            pageSize: articles.limit
          }
        } 
      })
    })
    .catch(err => {
      handleError({ ctx, err, message: '文章列表获取失败' })
    })
}

/**
 * @desc 新建草稿
 * @type GET
 * @param {String} [required] title                 标题
 * @param {String} [required] content               内容
 * @param {Array} [options] keywords                关键词 eg. ['Vue', 'React']
 * @param {String} [options] description            简介
 * @param {String} [options] category               分类 [必须是id]
 * @param {Array} [options] tag                     标签 eg. ['askj2jhasd123123', '12312klsadkjasdj'] 
 * @param {Object} [options] thumb                  缩略图 eg. { uid: '', title: '', url: '', size: 123 }
 * @param {Array} [options] extends                 扩展项 eg. [{ key: 'color', value: '#fff' }]
 */
articleCtrl.list.POST = async (ctx, next) => {
  const article = ctx.request.body
  const { title, content, category, tag } = article
  if (!title) {
    return handleError({ ctx, message: '缺少文章标题' })
  } else if (!content) {
    return handleError({ ctx, message: '缺少文章内容' })
  } else if (tag && !isType(tag, 'array')) {
    return handleError({ ctx, message: '标签参数错误，期望值：Array' })
  }

  article.renderedContent = marked(content)

  // 分类 必须是objectId类型
  if (category && !isObjectId(category)) {
    delete article.category
  }

  // 标签
  if (tag) {
    article.tag = tag.slice().map((item, index) => {
      if (!isObjectId(item)) {
        tag.splice(index, 1, null)
      }
    }).filter(item => !!item)
  }

  const action = article.state === 1 ? '新建文章（已发布）' : '新建草稿'

  await new ArticleModel(article).save()
    .then(data => {
      handleSuccess({ ctx, data, message: `${action}成功` })
    })
    .catch(err => {
      handleError({ ctx, err, message: `${action}失败` })
    })
}

// 批量修改文章（回收站，草稿箱，发布）
articleCtrl.list.PATCH = async (ctx, next) => {
  let { articleIds, state } = ctx.request.body
  if (!articleIds || !articleIds.length) {
    return handleError({ ctx, message: '未选中文章' })
  }
  let update = {}
  if ([-1, 0, 1, '-1', '0', '1'].includes(state)) {
    update.state = Number(state)
  }
  const action = state === 1
    ? '发布'
    : state === 0
      ? '转移草稿箱'
      : state === -1
       ? '转移回收站'
       : '操作'
  await ArticleModel.update({ _id: { $in: articleIds }}, { $set: update }, { multi: true })
    .exec()
    .then(data => {
      handleSuccess({ ctx, data: {}, message: `${action}成功`})
    })
    .catch(err => {
      handleError({ ctx, err, message: `${action}失败` })
    })
}

// 批量删除文章
articleCtrl.list.DELETE = async (ctx, next) => {
  const { articleIds } = ctx.request.body
  let text = '批量'
  if (!articleIds || !articleIds.length) {
    return handleError({ ctx, message: '未选中文章' })
  }
  if (articleIds.length === 1) {
    text = ''
  }
  await ArticleModel.remove({ _id: { $in: articleIds } }).exec()
    .then(async data => {
      // 删除相关评论
      await deleteCommentByArticleId(articleIds)
      handleSuccess({ ctx, data, message: `文章${text}删除成功` })
    })
    .catch(err => {
      handleError({ ctx, err, message: `文章${text}删除失败` })
    })
}

// 获取单篇文章详情
articleCtrl.item.GET = async (ctx, next) => {
  let { id } = ctx.params
  if (!isObjectId(id)) {
    return handleError({ ctx, message: '缺少文章id' })
  }

  const isVerified = await authIsVerified(ctx)

  // 获取相关文章
  const getRelatedArticles = async (data) => {
    if (data && data.tag && data.tag.length) {
      data.related = []
      await ArticleModel.find({ _id: { $nin: [ data._id ] }, state: 1, tag: { $in: data.tag.map(t => t._id) }})
        .select('id title thumb createAt meta')
        .exec()
        .then(articles => {
          data.related = articles
        })
        .catch(err => {
          console.error(err)
          logger.error(`相关文章获取失败,id:${data._id}`)
        })
    }
  }

  const getSiblingArticles = async (data) => {
    if (data && data._id) {
      let query = {}
      // 如果未通过权限校验，将文章状态重置为1
      if (!isVerified) {
        query.state = 1
      }
      let prev = await ArticleModel.findOne(query)
        .select('title createAt thumb')
        .sort('-createAt')
        .lt('createAt', data.createAt)
        .exec()
      let next = await ArticleModel.findOne(query)
        .select('title createAt thumb')
        .sort('createAt')
        .gt('createAt', data.createAt)
        .exec()
      prev = prev && prev.toObject()
      next = next && next.toObject()
      data.sibling = { prev, next }
    }
  }

  let data = null

  if (!isVerified) {
    data = await ArticleModel.findByIdAndUpdate(id, { $inc: { 'meta.pvs': 1 } }, { new: true })
      .select('-content') // 不返回content
      .populate('category tag')
      .exec()
      .catch(err => handhandleError({ ctx, err, message: '文章详情获取失败' }))
    if (data) {
      data = data.toObject()
    }
    await getRelatedArticles(data)
    await getSiblingArticles(data)
  } else {
    data = await ArticleModel.findById(id)
      .populate('category tag')
      .exec()
      .catch(err => handhandleError({ ctx, err, message: '文章详情获取失败' }))
    if (data) {
      data = data.toObject()
    }
  }

  handleSuccess({ ctx, data, message: '文章详情获取成功' })    
  
}

// 修改单篇文章
articleCtrl.item.PUT = async (ctx, next) => {
  let { id } = ctx.params
  let article = ctx.request.body
  let { title, content } = article
  if (!isObjectId(id)) {
    return handleError({ ctx, message: '缺少文章id' })
  }
  if (!title) {
    return handleError({ ctx, message: '缺少文章标题' })
  }
  if (!content) {
    return handleError({ ctx, message: '缺少文章内容' })
  }
  article.renderedContent = marked(content)

  if (!article.category || !isObjectId(article.category)) {
    delete article.category
  }

  await ArticleModel.findByIdAndUpdate(id, article, { new: true })
    .populate({ path: 'category', select: 'name description extends' })
    .populate({ path: 'tag', select: 'name description extends' })
    .exec()
    .then(data => {
      handleSuccess({ ctx, data, message: '修改文章成功' })
    })
    .catch(err => {
      handleError({ ctx, err, message: '修改文章失败' })
    })
}

// 修改单篇文章(发布状态， 是否公开， 私密密码)
articleCtrl.item.PATCH = async (ctx, next) => {
  const { id } = ctx.params
  const { state, isPublic, password } = ctx.request.body
  if (!isObjectId(id)) {
    return handleError({ ctx, message: '缺少文章id' })
  }

  const params = {}

  if (![0, 1, '0', '1'].includes(state)) {
    return handleError({ ctx, message: '文章状态不对' })
  }

  params.state = state

  if (isType(isPublic, 'boolean')) {
    params.public = isPublic
    params.password = password
  }

  await ArticleModel.findByIdAndUpdate(id, params, { new: true })
    .populate({ path: 'category', select: 'name description extends' })
    .populate({ path: 'tag', select: 'name description extends' })
    .exec()
    .then(data => {
      handleSuccess({ ctx, data, message: '操作成功' })
    })
    .catch(err => {
      handleError({ ctx, err, message: '操作失败' })
    })
} 

// 删除单篇文章
articleCtrl.item.DELETE = async (ctx, next) => {
  let { id } = ctx.params
  if (!isObjectId(id)) {
    return handleError({ ctx, message: '缺少文章id' })
  }

  await ArticleModel.remove({ _id: id }).exec()
    .then(async data => {
      await deleteCommentByArticleId(id)
      handleSuccess({ ctx, message: '删除文章成功' })
    })
    .catch(err => {
      handleError({ ctx, err, message: '删除文章失败' })
    })
}

export default {
  list: async (ctx, next) => await handleRequest({ ctx, next, type: articleCtrl.list }),
  item: async (ctx, next) => await handleRequest({ ctx, next, type: articleCtrl.item })
}
