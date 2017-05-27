/**
 * article controller
 */

const mongoose = require('mongoose')
const { 
  handle: { handleRequest, handleSuccess, handleError },
  validate: { isObjectId },
  marked,
  createObjectId
} = require('../util')
const config = require('../config')
const { ArticleModel, CategoryModel, TagModel } = require('../model')
const authIsVerified = require('../middleware/auth')
const articleCtrl = { list: {}, item: {} }

// 获取文章列表
articleCtrl.list.GET = async (ctx, next) => {
  // state => -1 || 0 || 1
  // sort => meta.likes: -1 || ...    方便后台列表排序
  // hot => meta.comments: -1 && meta.likes: -1 && meta.visit: -1
  let { page, page_size, state, keyword, category, tag, start_date, end_date, hot, sort } = ctx.query

  // 过滤条件
  const options = {
    sort: { create_at: -1 },
    page: Number(page || 1),
    limit: Number(page_size || config.BLOG.LIMIT),
    populate: [
      { path: 'category', select: 'name description extends' },
      { path: 'tag', select: 'name description extends' }
    ],
    select: '-content -rendered_content' // 文章列表不需要content
  }

  // 文章查询条件
  let query = {}

  // 文章状态
  if (['-1', '0', '1', -1, 0, 1].includes(state)) {
    query.state = state
  }

  // 搜索关键词
  if (keyword) {
    const keywordReg = new RegExp(keyword)
    query.$or = [
      { title:  keywordReg },
      { excerpt:  keywordReg }
    ]
  }

  // 虽然hot可以放在sort里，但这里为了前台热门文章获取，单独列出hot
  // hot和sort二者只能存其一
  if (!!hot) {
    options.sort = {
      'meta.comments': -1,
      'meta.likes': -1,
      'meta.visit': -1,
      create_at: -1
    }
    options.select = 'title create_at meta tag thumbs'
  } else if (!!sort) {
    // sort
    options.sort = typeof sort === 'string' ? JSON.parse(sort) : sort
    options.sort.create_at = options.sort.create_at || -1
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
          handleError({ ctx, message: '分类查找失败', err })
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
        .catch(err => {
          handleError({ ctx, message: '标签查找失败', err })
        })
    }
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

  await ArticleModel.paginate(query, options)
    .then(articles => {
      handleSuccess({
        ctx,
        message: '文章列表获取成功',
        data: {
          list: articles.docs,
          pagination: {
            total: articles.total,
            current_page: articles.page > articles.pages ? articles.pages : articles.page,
            total_page: articles.pages,
            per_page: articles.limit
          }
        } 
      })
    })
    .catch(err => {
      handleError({ ctx, err, message: '文章列表获取失败' })
    })
}

// 发布新文章
articleCtrl.list.POST = async (ctx, next) => {
  let article = ctx.request.body
  let { title, content } = article
  if (!title) {
    return handleError({ ctx, message: '缺少文章标题' })
  }
  if (!content) {
    return handleError({ ctx, message: '缺少文章内容' })
  }

  article.rendered_content = marked(content)

  // 由于cms输入限制，category和tag只能传过来name，不能传_id
  const _c = await CategoryModel.findOne({ name: article.name }).exec()
  if (_c && _c._id) {
    article.category = _c._id
  }
  
  const _ts = await TagModel.find({ name: { $in: article.tag} }).exec()
  article.tag = _ts.map(item => item._id)

  await new ArticleModel(article).save()
    .then(data => {
      handleSuccess({ ctx, data, message: '发布文章成功' })
    })
    .catch(err => {
      handleError({ ctx, err, message: '发布文章失败' })
    })
}

// 批量修改文章（回收站，草稿箱，发布）
articleCtrl.list.PATCH = async (ctx, next) => {
  let { article_ids, state } = ctx.request.body
  if (!article_ids || !article_ids.length) {
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
  await ArticleModel.update({ _id: { $in: article_ids }}, { $set: update }, { multi: true })
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
  const { article_ids } = ctx.request.body
  let text = '批量'
  if (!article_ids || !article_ids.length) {
    return handleError({ ctx, message: '未选中文章' })
  }
  if (article_ids.length === 1) {
    text = ''
  }
  await ArticleModel.remove({ _id: { $in: article_ids } }).exec()
    .then(data => {
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
        .select('id title thumbs create_at meta')
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
        .select('title create_at thumbs')
        .sort('-create_at')
        .lt('create_at', data.create_at)
        .exec()
      let next = await ArticleModel.findOne(query)
        .select('title create_at thumbs')
        .sort('create_at')
        .gt('create_at', data.create_at)
        .exec()
      prev = prev && prev.toObject()
      next = next && next.toObject()
      data.sibling = { prev, next }
    }
  }

  let data = null

  if (!isVerified) {
    data = await ArticleModel.findByIdAndUpdate(id, { $inc: { 'meta.visit': 1 } }, { new: true })
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
  article.rendered_content = marked(content)
  await ArticleModel.findByIdAndUpdate(id, article, { new: true })
    .exec()
    .then(data => {
      handleSuccess({ ctx, data, message: '修改文章成功' })
    })
    .catch(err => {
      handleError({ ctx, err, message: '修改文章失败' })
    })
}

// 修改单篇文章
articleCtrl.item.PATCH = async (ctx, next) => {
  let { id } = ctx.params
  let { state } = ctx.request.body
  if (!isObjectId(id)) {
    return handleError({ ctx, message: '缺少文章id' })
  }

  if (![-1, 0, 1, '-1', '0', '1'].includes(state)) {
    return handleError({ ctx, message: '文章状态不对' })
  }

  await ArticleModel.findByIdAndUpdate(id, { state }, { new: true })
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
  await ArticleModel.findByIdAndRemove(id).exec()
    .then(data => {
      handleSuccess({ ctx, data, message: '删除文章成功' })
    })
    .catch(err => {
      handleError({ ctx, err, message: '删除文章失败' })
    })
}

module.exports = {
  list: async (ctx, next) => await handleRequest({ ctx, next, type: articleCtrl.list }),
  item: async (ctx, next) => await handleRequest({ ctx, next, type: articleCtrl.item })
}
