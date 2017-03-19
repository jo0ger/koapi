/**
 * category controller
 */

const { 
  handle: { handleRequest, handleSuccess, handleError },
  validate: { isObjectId }
} = require('../util')
const { CategoryModel, ArticleModel } = require('../model')
const authIsVerified = require('../middleware/auth')
const categoryCtrl = { list: {}, item: {} }

// 获取分类列表，不分页
categoryCtrl.list.GET = async (ctx, next) => {
  let { keyword = '' } = ctx.query
  const keywordReg = new RegExp(keyword)
  const query = {
    $or: [
      { name: keywordReg },
      { description: keywordReg }
    ]
  }

  const querySuccess = (ctx, categories) => {
    handleSuccess({
      ctx,
      message: '分类列表获取成功',
      data: {
        list: categories,
        total: categories.length
      }
    })
  }

  // 查询article中的category的聚合数据
  const getCatesCount = async (ctx, categories) => {
    let $match = {}
    if (!authIsVerified(ctx)) {
      $match = { state: 1 }
    }
    await ArticleModel.aggregate([
      { $match },
      { $unwind: '$category' },
      { $group: {
        _id: '$category',
        total_count: { $sum: 1 }
      } }
    ]).exec().then(counts => {
      categories = categories.map(category => {
        let matched = counts.find(count => count._id === category._id)
        category = category.toObject()
        category.count = matched && matched.total_count || 0
        return category
      })
      querySuccess(ctx, categories)
    })
  }

  let categories = await CategoryModel.find(query).exec().catch(err => {
    handleError({ ctx, err, message: '分类列表获取失败' })
  })
  await getCatesCount(ctx, categories)
}

// 新建分类
categoryCtrl.list.POST = async (ctx, next) => {
  let { category, category: { name } } = ctx.request.body

  if (!name) {
    handleError({ ctx, message: '缺少分类名称' })
    return
  }
  // 保存category
  const saveCategory = async () => {
    await CategoryModel.create(category).then(data => {
      handleSuccess({ ctx, message: '新建分类成功', data })
    }).catch(err => {
      handleError({ ctx, err, message: '新建分类失败' })
    })
  }

  let { length } = await CategoryModel.find({ name }).exec().catch(err => {
    handleError({ ctx, err, message: '新建分类失败' })
  })
  if (!length) {
    await saveCategory()
  } else {
    handleError({ ctx, message: '该分类名称已存在' })
  }
}

// 批量删除分类
categoryCtrl.list.DELETE = async (ctx, next) => {
  let { categories } = ctx.request.body
  if (!categories || !categories.length) {
    handleError({ ctx, message: '未选中分类' })
    return
  }
  let data = await CategoryModel.remove({ _id: { $in: categories }})
    .catch(err => {
      handleError({ ctx, message: `${categories.length>1?'批量':''}删除分类失败`, err })
    })
  handleSuccess({ ctx, message: `${categories.length>1?'批量':''}删除分类成功`, data })
}

// 获取单个分类详情
categoryCtrl.item.GET = async (ctx, next) => {
  let { id } = ctx.params
  if (!isObjectId(id)) {
    handleError({ ctx, message: '缺少分类ID' })
    return
  }

  const findArticles = async (data) => {
    await ArticleModel.find({ category: id })
      .select('-category')
      .populate({
        path: 'tag',
        select: 'name description extends'
      })
      .exec()
      .then(articles => {
        data = data.toObject()
        data.articles = articles
        data.articles_count = articles.length
        handleSuccess({ ctx, message: '分类详情获取成功', data })
      })
      .catch(err => {
        handleError({ ctx, message: '分类详情获取失败'}, err )
      })
  }

  let result = await CategoryModel.findById(id).exec()
    .catch(err => {
      handleError({ ctx, message: '分类详情获取失败', err })
    })
  if (result) {
    await findArticles(result)
  } else {
    handleSuccess({ ctx, message: '该分类不存在' })
  }
}

// 修改单个分类
categoryCtrl.item.PUT = async (ctx, next) => {
  let { id } = ctx.params
  let category = ctx.request.body
  let { name } = category
  if (!isObjectId(id)) {
    handleError({ ctx, message: '缺少分类ID' })
    return
  }
  if (!name) {
    handleError({ ctx, message: '缺少分类名称' })
    return
  }

  const putCategory = async () => {
    await CategoryModel.findByIdAndUpdate(id, category, { new: true }).exec()
      .then(data => {
        handleSuccess({ ctx, message: '修改分类成功', data })
      })
      .catch(err => {
        handleError({ ctx, message: '修改分类失败' })
      })
  }

  let { length } = await CategoryModel.find({ name }).exec().catch(err => {
    handleError({ ctx, err, message: '修改分类失败' })
  })
  if (!length) {
    await putCategory()
  } else {
    handleError({ ctx, message: '该分类名称已存在' })
  }
}

// 删除单个分类
categoryCtrl.item.DELETE = async (ctx, next) => {
  let { id } = ctx.params
  if (!isObjectId(id)) {
    handleError({ ctx, message: '缺少分类ID' })
    return
  }
  await CategoryModel.findByIdAndRemove(id).exec()
    .then(data => {
      handleSuccess({ ctx, message: '删除分类成功' })
    })
    .catch(err => {
      handleError({ ctx, mesage: '删除分类失败', err })
    })
}

module.exports = {
  list: async (ctx, next) => await handleRequest({ ctx, type: categoryCtrl.list, next }),
  item: async (ctx, next) => await handleRequest({ ctx, type: categoryCtrl.item, next })
}
