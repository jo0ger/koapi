/**
 * @desc 站点地图 Controller 
 * @author Jooger <zzy1198258955@163.com>
 * @date 11 Sep 2017
 */

import { buildSitemap, handleError, handleRequest, handleSuccess } from '../../utils'

const sitemapCtrl = {}

sitemapCtrl.GET = async (ctx, next) => {
  const sitemap = await buildSitemap().catch(err => handleError({ ctx, err, message: '站点地图获取失败' }))
  ctx.set('Content-Type', 'application/xml')
  ctx.status = 200
  ctx.body = sitemap
}

export default async (ctx, next) => await handleRequest({ ctx, next, type: sitemapCtrl })
