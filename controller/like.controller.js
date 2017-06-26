/**
 * 点赞 | 顶 | 喜欢 controller
 */

const { 
  handle: { handleRequest, handleSuccess, handleError },
  validate: { isObjectId }
} = require('../util')
const { ArticleModel, CommentModel } = require('../model')
const likeCtrl = {}

// 点赞
// type 0 文章 | 1 评论
likeCtrl.POST = async (ctx, next) => {
  let { id, type } = ctx.request.body
  if (!isObjectId(id)) {
    return handleError({ ctx, message: '少侠，请输入id' })
  }
  if (![0, 1, '0', '1'].includes(type)) {
    return handleError({ ctx, message: '少侠，请输入评论类型' })
  }

  let isArticle = type == 0

  let data = (
    isArticle ? ArticleModel : CommentModel
  )
  .findByIdAndUpdate(id, { $inc: { [`${isArticle ? 'meta.likes' : 'likes'}`] : 1 } })
  .exec()
  .catch(err => {
    handleError({ ctx, err, message: '点赞失败' })
  })

  if (data) {
    handleSuccess({ ctx, message: '点赞成功' })
  }
}

module.exports = async (ctx, next) => await handleRequest({ ctx, next, type: likeCtrl })
