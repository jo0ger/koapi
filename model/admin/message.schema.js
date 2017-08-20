/**
 * @desc 消息通知
 * @author Jooger
 * @email zzy1198258955@163.com
 * @date 20 Aug 2017
 */

import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'

const messageSchema = new mongoose.Schema({
  // 标题
  title: { type: String, required: true },
  // 消息类型 0 普通评论 | 1 评论+@我 | 2 评论+回复我 | 3 评论+@我+回复我
  type: { type: Number, required: true },
  // 消息状态 0 未读 | 1 已读
  state: { type: Number, default: 0 },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  // 创建时间
  createAt: { type: Date, default: Date.now },
  // 修改时间
  updateAt: { type: Date, default: Date.now }
})

messageSchema.plugin(mongoosePaginate)

export default messageSchema
