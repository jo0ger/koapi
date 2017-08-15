/**
 * @desc 文章 Model
 * @author Jooger
 */

import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'

const articleSchema = new mongoose.Schema({
  // 文章标题
  title: { type: String, required: true },
  // 文章关键字（FOR SEO）
  keywords: [{ type: String }],
  // 文章摘要 (FOR SEO)
  description: { type: String, default: '' },
  // 文章原始markdown内容
  content: { type: String, required: true, validate: /\S+/ },
  // markdown渲染后的htmln内容
  renderedContent: { type: String, required: true, validate: /\S+/ },
  // 缩略图 （图片uid, 图片名称，图片URL， 图片大小）
  thumb: { uid: String, title: { type: String, default: '' }, url: { type: String, default: '' }, size: Number },
  // 文章状态 （ 0 草稿 | 1 已发布 ）
  state: { type: Number, default: 0 },
  // 发布日期
  createAt: { type: Date, default: Date.now },
  // 最后编辑日期
  updateAt: { type: Date, default: Date.now },
  // 分类
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  // 标签
  tag: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  // 文章元数据 （浏览量， 喜欢数， 评论数）
  meta: {
    pvs: { type: Number, default: 0 },
    ups: { type: Number, default: 0 },
    comments: { type: Number, default: 0 }
  },
  // 文章扩展 （color, bg(background), fontSize, ...）
  extends: [{
    key: { type: String, validate: /\S+/ },
    value: { type: String, validate: /\S+/ }
  }]
})

articleSchema.plugin(mongoosePaginate)

export default articleSchema
