/**
 * @desc 博客 api routes
 * @author Jooger
 * @date 10 Aug 2017
 */

import { blogControllers } from '../controller'

const prefix = 'blog'

export default router => {

  // Article文章
  router.all(`${prefix}-article`, `/${prefix}/article`, blogControllers.article.list)
  router.all(`${prefix}-article-id`, `/${prefix}/article/:id`, blogControllers.article.item)

  // Archive文章归档
  router.all(`${prefix}-archive`, `/${prefix}/archive`, blogControllers.archive)

  // Category分类
  router.all(`${prefix}-category`, `/${prefix}/category`, blogControllers.category.list)
  router.all(`${prefix}-category-id`, `/${prefix}/category/:id`, blogControllers.category.item)

  // Tag标签
  router.all(`${prefix}-tag`, `/${prefix}/tag`, blogControllers.tag.list)
  router.all(`${prefix}-tag-id`, `/${prefix}/tag/:id`, blogControllers.tag.item)

  // Comment评论
  router.all(`${prefix}-comment`, `/${prefix}/comment`, blogControllers.comment.list)
  router.all(`${prefix}-comment-author`, `/${prefix}/comment/author`, blogControllers.comment.author)
  router.all(`${prefix}-comment-id`, `/${prefix}/comment/:id`, blogControllers.comment.item)

  // Like 点赞
  router.all(`${prefix}-like`, `/${prefix}/like`, blogControllers.like)

  // Sitemap 站点地图
  router.all(`${prefix}-sitemap`, `/${prefix}/sitemap`, blogControllers.sitemap)
  router.all(`${prefix}-sitemap`, `/${prefix}/sitemap.xml`, blogControllers.sitemap)
}
