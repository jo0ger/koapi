/**
 * @desc Sitemap
 * @author Jooger <zzy1198258955@163.com>
 * @date 11 Sep 2017
 */

import path from 'path'
import fs from 'fs'
import sitemap from 'sitemap'
import { ArticleModel, CategoryModel, TagModel } from '../model'

const xmlPath = path.resolve(config.server.rootPath, '..', 'jooger.me/client/static/sitemap.xml')
const pages = [
  { url: '', changefreq: 'always', priority: 1 },
  { url: '/about', changefreq: 'always', priority: 1 },
  { url: '/sitemap', changefreq: 'always', priority: 1 },
  { url: '/guestbook', changefreq: 'always', priority: 1 }
]
let sm = null
function getInstance () {
  return sm || sitemap.createSitemap({
    hostname: config.blog.siteUrl,
    cacheTime: 600000,
    urls: [...pages]
  })
}

function generate (instance) {
  return Promise.all([
    ArticleModel.find({ state: 1 }).sort('-createAt').exec(),
    CategoryModel.find().sort('-createAt').exec(),
    TagModel.find().sort('-createAt').exec()
  ]).then(([articles, categories, tags]) => {
    articles.forEach(article => {
      instance.add({
        url: `/article/${article._id}`,
        changefreq: 'daily',
        lastmodISO: article.updateAt.toISOString(),
        priority: 0.8
      })
    })
    categories.forEach(category => {
      instance.add({
        url: `/category/${category.name}`,
        changefreq: 'daily',
        lastmodISO: (category.updateAt || category.createAt).toISOString(),
        priority: 0.6
      })
    })
    tags.forEach(tag => {
      instance.add({
        url: `/tag/${tag.name}`,
        changefreq: 'daily',
        lastmodISO: tag.updateAt.toISOString(),
        priority: 0.6
      })
    })
    return instance
  }).catch(err => {
    logger.error('站点地图生成过程中，数据库查询错误，err：', err.message)
    console.error(err)
  })
}

export default () => {
  const instance = getInstance()
  return new Promise((resolve, reject) => {
    return generate(instance).then(sm => {
      sm.toXML((err, xml) => {
        if (err) {
          console.error(err)
          return reject(err)
        }
        fs.writeFileSync(xmlPath, sm.toString())
        return resolve(xml)
      })
    }).catch(err => reject(err))
  })
}
