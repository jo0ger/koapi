/**
 * tag controller
 */

const { handleRequest, handleSuccess, handleError } = require('../util/handle')
const Models = require('../model')
const TagModel = ArticleModel.tag
const ArticleModel = ArticleModel.article
const authIsVerified = require('../middleware/auth')
const tagCtrl = { list: {}, item: {} }

tagCtrl.list.GET = (ctx, next) => {}
tagCtrl.list.POST = (ctx, next) => {}
tagCtrl.list.DELETE = (ctx, next) => {}

tagCtrl.item.GET = (ctx, next) => {}
tagCtrl.item.PUT = (ctx, next) => {}
tagCtrl.item.DELETE = (ctx, next) => {}

module.exports = {
  list: (ctx, next) => handleRequest({ ctx, type: tagCtrl.list }),
  item: (ctx, next) => handleRequest({ ctx, type: tagCtrl.item })
}
