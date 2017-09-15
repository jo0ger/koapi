/**
 * @desc 权限相关
 * @author Jooger
 */

import md5 from 'md5'
import jwt from 'jsonwebtoken'
import { handleRequest, handleSuccess, handleError } from '../../utils'
import { AuthModel } from '../../model'

const authCtrl = {
  login: {},
  logout: {},
  info: {}
}

function md5Encode (str = '') {
  return md5(`${config.server.auth.secretKey}${str}`)
}
/**
 * @desc jwt sign
 * @param  {Object} payload={}
 * @param  {Boolean} isLogin=false
 */
function signUserToken (payload = {}, isLogin = false) {
  const { secretKey, expired } = config.server.auth
  return jwt.sign(payload, secretKey, { expiresIn: isLogin ? expired : 0 })
}

// 获取个人信息
authCtrl.info.GET = async (ctx, next) => {
  await AuthModel.findOne({})
    .select('-password')
    .exec()
    .then(data => {
      handleSuccess({ ctx, data, message: '获取个人信息成功' })
    })
    .catch(err => {
      handleError({ ctx, err, message: '获取个人信息失败' })
    })
}

// 登录，生成token
authCtrl.login.POST = async (ctx, next) => {
  const { name, password } = ctx.request.body

  if (!name) {
    return handleError({ ctx, message: '用户名不能为空' })
  }
  if (!password) {
    return handleError({ ctx, message: '密码不能为空' })
  }

  const { secretKey, expired, cookieName } = config.server.auth
  let auth = await AuthModel.findOne({})
    .exec()
    .catch(err => {
      handleError({ ctx, err, message: '登录失败' })
    })
  const encodePassword = md5Encode(password)
  if (auth) {
    if (auth.name === name && auth.password === encodePassword) {
      auth = auth.toObject()
      const token = signUserToken({
        id: auth._id, 
        name: auth.name
      }, true)
      ctx.cookies.set(cookieName, token, {
        signed: true,
        domain: ctx.requestrequest.get('origin')
      })
      handleSuccess({ ctx, data: { info: { ...auth }, token }, message: '登录成功' })
    } else if (auth.name !== name) {
      handleError({ ctx, message: '少侠，名字错啦！' })
    } else if (auth.password !== encodePassword) {
      handleError({ ctx, message: '少侠，密码错啦！' })
    } else {
      handleError({ ctx, message: '少侠，我不认识你！' })
    }
  } else {
    handleError({ ctx, message: '少侠，我不认识你！' })
  }
}

// 退出
authCtrl.logout.GET = async (ctx, next) => {
  const { secretKey, expired, cookieName } = config.server.auth
  const token = signUserToken({
    id: auth._id, 
    name: auth.name
  }, false)
  ctx.cookies.set(cookieName, token, {
    signed: true,
    domain: ctx.requestrequest.get('origin')
  })
  handleSuccess({ ctx, message: '退出成功' })
} 

// 修改个人信息
authCtrl.info.PUT = async (ctx, next) => {
  let { auth, auth: { name, password, slogan, avatar, old_password, confirm_password } } = ctx.request.body

  const error = (message = '') => {
    handleError({ ctx, message })
  }
  
  if (!!old_password) {
    if (!password) {
      return error('新密码不能为空')
    }
    if (!confirm_password) {
      return error('确认密码不能为空')
    }
    if (password === old_password) {
      return error('新旧密码不能一致')
    }
    if (password !== confirm_password) {
      return error('密码不一致')
    }
  }

  let _auth = await AuthModel.findOne({}).exec()
    .catch(err => {
      handleError({ ctx, err, message: '用户信息修改失败' })
    })

  if (_auth) {
    if (!!old_password && md5Encode(old_password) !== _auth.password) {
      return error('原密码错误')
    }
    await AuthModel.findByIdAndUpdate(_auth._id, { $set: { ...auth }}, { new: true })
      .select('name avatar slogan')
      .exec()
      .then(data => {
        handleSuccess({ ctx, data, message: '用户信息修改成功' })
      })
      .catch(err => {
        handleError({ ctx, err, message: '用户信息修改失败' })
      })
  }
}

export default {
  login: async (ctx, next) => await handleRequest({ ctx, next, type: authCtrl.login }),
  logout: async (ctx, next) => await handleRequest({ ctx, next, type: authCtrl.logout }),
  info: async (ctx, next) => await handleRequest({ ctx, next, type: authCtrl.info })
}
