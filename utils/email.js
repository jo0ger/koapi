/**
 * @desc 发送邮件
 * @author Jooger
 * @email zzy1198258955@163.com
 * @date 20 Aug 2017
 */

import nodemailer from 'nodemailer'

let isVerify = false
const transporter = nodemailer.createTransport({
  // host: 'imap.163.com',
  // port: 993,
  service: '163',
  secure: true,
  auth: {
    user: config.info.email,
    pass: '19950102zzy'
  }
})

export const verifyMailClient = async () => {
  return new Promise((resolve, reject) => {
    transporter.verify((err, success) => {
      if (err) {
        isVerify = false
        logger.error('邮件客户端初始化失败，将在1分钟后重试，err：', err.message)
        reject(err)
        setTimeout(verifyMailClient, 60 * 1000)
      } else {
        isVerify = true
        logger.info('邮件客户端初始化成功')
        resolve()
      }
    })
  })
}

/**
 * @desc 发送邮件
 * @param  {Object} opt={}            邮件参数
 * @param  {Boolean} toMe=false       是否是给自己发送邮件
 */
export default (opt = {}, toMe = false) => {
  if (!isVerify) {
    return logger.warn('邮件客户端初始化失败，拒绝发送邮件')
  }
  opt.from = `Jooger <${config.info.email}>`
  if (toMe) {
    opt.to = config.info.email
  }
  transporter.sendMail(opt, (err, info) => {
    if (err) {
      return logger.error('邮件发送失败，err：', err.message)
    }
    logger.info('邮件发送成功', info.messageId, info.response)
  })
}
