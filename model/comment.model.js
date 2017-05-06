/**
 * 评论 model
 */

const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')
const mongoosePaginate = require('mongoose-paginate')

autoIncrement.initialize(mongoose.connection)

const commentSchema = new mongoose.Schema({
  // 评论通用项
  create_at: { type: Date, default: Date.now }, // 创建时间
  update_at: { type: Date, default: Date.now }, // 修改时间
  content: { type: String, required: true, validate: /\S+/ }, // 评论内容
  rendered_content: { type: String, required: true, validate: /\S+/ }, // marked渲染后的内容
  state: { type: Number, default: 0 },  // 状态 -2 垃圾评论 | -1 已删除 | 0 待审核 | 1 通过
  author: {   // 评论发布者
    name: { type: String, required: true, validate: /\S+/ },  // 姓名
    // 邮箱
    email: { type: String, required: true, validate: /\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}/ },
    // 个人站点地址
    site: { type: String, validate: /^((https|http):\/\/)+[A-Za-z0-9]+\.[A-Za-z0-9]+[\/=\?%\-&_~`@[\]\':+!]*([^<>\"\"])*$/ },
    avatar: { type: String, default: '' }
  },
  likes: { type: Number, default: 0 }, // 点赞数
  sticky: { type: Boolean, default: false }, // 是否置顶
  type: { type: Number, default: 0 }, // 类型 0 文章评论 | 1 页面评论 包括留言板或者作品展示页面等
  meta: {
    ip: String, // 用户IP
    ip_location: Object,  // IP所在地
    agent: { type: String, validate: /\S+/ } // user agent
  } ,
  extends: [{
    key: { type: String, validate: /\S+/ },
    value: { type: String, validate: /\S+/ }
  }],
  page_id: String, // 页面id，type = 0时是文章的ID，type = 1时是页面的name，option model中Menu的name
  // 子评论具备项
  parent_id: String, // 父评论ID，parent_id和forward_id二者应同时存在
  forward_id: String  // 前一条评论ID，可以是parent_id， 比如 B评论 是 A评论的回复，则B.forward_id = A._id，主要是为了查看评论对话时的评论树构建
})

commentSchema.plugin(mongoosePaginate)
commentSchema.plugin(autoIncrement.plugin, {
  model: 'Comment',
  field: 'id',
  startAt: 1,
  incrementBy: 1
})

export default commentSchema
