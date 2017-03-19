/**
 * tag controller
 */

const { 
  handle: { handleRequest, handleSuccess, handleError },
  validate: { isObjectId }
} = require('../util')
const { TagModel, ArticleModel } = require('../model')
const authIsVerified = require('../middleware/auth')
const tagCtrl = { list: {}, item: {} }

// 获取标签列表，不分页
tagCtrl.list.GET = async (ctx, next) => {
  let { keyword } = ctx.query
  let query = {}
  if (keyword) {
    const keywordReg = new RegExp(keyword)
    query.$or = [
      { name: keywordReg },
      { description: keywordReg }
    ]
  }

  const querySuccess = (ctx, tags) => {
    handleSuccess({
      ctx,
      message: '标签列表获取成功',
      data: {
        list: tags,
        total: tags.length
      }
    })
  }

  // 查询article中的tag的聚合数据
  const getTagsCount = async (ctx, tags) => {
    let $match = {}
    if (!authIsVerified(ctx)) {
      $match = { state: 1 }
    }
    await ArticleModel.aggregate([
      { $match },
      { $unwind: '$tag' },
      { $group: {
        _id: '$tag',
        total_count: { $sum: 1 }
      } }
    ]).exec().then(counts => {
      tags = tags.map(tag => {
        let matched = counts.find(count => count._id === tag._id)
        tag = tag.toObject()
        tag.count = matched && matched.total_count || 0
        return tag
      })
      querySuccess(ctx, tags)
    })
  }

  let tags = await TagModel.find(query).exec().catch(err => {
    handleError({ ctx, err, message: '标签列表获取失败' })
  })
  await getTagsCount(ctx, tags)

}

// 新建标签
tagCtrl.list.POST = async (ctx, next) => {
  let { tag, tag: { name } } = ctx.request.body

  if (!name) {
    handleError({ ctx, message: '缺少标签名称' })
    return
  }
  // 保存tag
  const saveTag = async () => {
    await TagModel.create(tag).then(data => {
      handleSuccess({ ctx, message: '新建标签成功', data })
    }).catch(err => {
      handleError({ ctx, err, message: '新建标签失败' })
    })
  }

  let { length } = await TagModel.find({ name }).exec().catch(err => {
    handleError({ ctx, err, message: '新建标签失败' })
  })
  if (!length) {
    await saveTag()
  } else {
    handleError({ ctx, message: '该标签名称已存在' })
  }
}

// 批量删除标签
tagCtrl.list.DELETE = async (ctx, next) => {
  let { tags } = ctx.request.body
  if (!tags || !tags.length) {
    handleError({ ctx, message: '未选中标签' })
    return
  }
  let data = await TagModel.remove({ _id: { $in: tags }}).catch(err => {
    handleError({ ctx, message: `${tags.length>1?'批量':''}删除标签失败`, err })
  })

  handleSuccess({ ctx, message: `${tags.length>1?'批量':''}删除标签成功`, data })
}

// 获取单个标签详情
tagCtrl.item.GET = async (ctx, next) => {
  let { id } = ctx.params
  if (!isObjectId(id)) {
    handleError({ ctx, message: '缺少标签ID' })
    return
  }

  const findArticles = async (data) => {
    await ArticleModel.find({ tag: id })
      .select('-tag')
      .populate({
        path: 'category',
        select: 'name description extends'
      })
      .exec()
      .then(articles => {
        data = data.toObject()
        data.articles = articles
        data.articles_count = articles.length
        handleSuccess({ ctx, message: '标签详情获取成功', data })
      })
      .catch(err => {
        handleError({ ctx, message: '标签详情获取失败'}, err )
      })
  }

  let result = await TagModel.findById(id).exec()
    .catch(err => {
      handleError({ ctx, message: '标签详情获取失败', err })
    })
  if (result) {
    await findArticles(result)
  } else {
    handleSuccess({ ctx, message: '该标签不存在' })
  }
}

// 修改单个标签
tagCtrl.item.PUT = async (ctx, next) => {
  let { id } = ctx.params
  let tag = ctx.request.body
  let { name } = tag
  if (!isObjectId(id)) {
    handleError({ ctx, message: '缺少标签ID' })
    return
  }
  if (!name) {
    handleError({ ctx, message: '缺少标签名称' })
    return
  }

  const putTag = async () => {
    await TagModel.findByIdAndUpdate(id, tag, { new: true }).exec()
      .then(data => {
        handleSuccess({ ctx, message: '修改标签成功', data })
      })
      .catch(err => {
        handleError({ ctx, message: '修改标签失败' })
      })
  }

  let { length } = await TagModel.find({ name }).exec().catch(err => {
    handleError({ ctx, err, message: '修改标签失败' })
  })
  if (!length) {
    await putTag()
  } else {
    handleError({ ctx, message: '该标签名称已存在' })
  }
}

// 删除单个标签
tagCtrl.item.DELETE = async (ctx, next) => {
  let { id } = ctx.params
  if (!isObjectId(id)) {
    handleError({ ctx, message: '缺少标签ID' })
    return
  }
  await TagModel.findByIdAndRemove(id).exec()
    .then(data => {
      handleSuccess({ ctx, message: '删除标签成功' })
    })
    .catch(err => {
      handleError({ ctx, mesage: '删除标签失败', err })
    })
}

module.exports = {
  list: async (ctx, next) => await handleRequest({ ctx, type: tagCtrl.list, next }),
  item: async (ctx, next) => await handleRequest({ ctx, type: tagCtrl.item, next })
}
