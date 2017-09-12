/**
 * 文章归档controller
 */

import { handleRequest, handleSuccess, handleError } from '../../utils'
import { ArticleModel } from '../../model'
const archivesCtrl = {}

archivesCtrl.GET = async (ctx, next) => {
  let { page, pageSize } = ctx.query
  let $match = {}
  if (!ctx._verify) {
    $match = { state: 1 }
  }
  let $page = Number(page || 1)
  let $limit = Number(pageSize || config.blog.postLimit)
  let $skip = ($page - 1) * $limit

  // let total = await ArticleModel.count($match).exec()

  let list = await ArticleModel.aggregate([
    { $match },
    { $sort: { createAt: -1 } },
    // 先不分页了
    // { $skip },
    // { $limit },
    { $project: {
      year: { $year: "$createAt" },
      title: 1,
      description: 1,
      createAt: 1,
      'meta.pvs': 1,
      'meta.comments': 1,
      'meta.likes': 1,
      category: 1,
      tag: 1
    } },
    { $group: {
      _id: '$year',
      year: { $first: '$year' },
      list: {
        $push: {
          _id: '$_id',
          title: '$title',
          description: '$description',
          createAt: '$createAt',
          meta: {
            pvs: '$meta.pvs',
            likes: '$meta.likes',
            comments: '$meta.comments'
          },
          category: '$category',
          tag: '$tag'
        }
      }
    } }
  ])
  .exec().catch(err => handleError({ ctx, err, message: '获取文章归档失败' }))
  if (list) {
    for (let m = 0; m < list.length; m++) {
      let archive = list[m]
      for (let n = 0; n < archive.list.length; n++) {
        let a = await ArticleModel.findById(archive.list[n]._id)
          .select('title category tag createAt updateAt meta')
          .populate('category tag')
          .exec()
        archive.list.splice(n, 1, a.toObject())
      }
    }
    // 去除_id
    list.forEach(v => {
      delete v._id
    })
    list.sort((m, n) => n.year - m.year)
    handleSuccess({
      ctx, 
      data: {
        list
        // total
        // pagination: {
        //   total,
        //   current_page: $page,
        //   total_page: Math.ceil(total / $limit),
        //   per_page: $limit
        // }
      },
      message: '获取文章归档成功' }
    )
  } else {
    handleError({ ctx, message: '获取文章归档失败' })
  }
}

export default async (ctx, next) => await handleRequest({ ctx, next, type: archivesCtrl })
