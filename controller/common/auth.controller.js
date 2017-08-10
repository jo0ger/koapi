/**
 * @desc 权限相关
 * @author Jooger
 */

import md5 from 'md5'
import { handleRequest, handleSuccess, handleError } from '../../utils'
import { AuthModel } from '../../model'
const authCtrl = {}

function md5Encode (str = '') {
  return md5(`${AUTH.SECRET_KEY}${str}`)
}

// 获取个人信息
authCtrl.GET = async (ctx, next) => {
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

// 生成token
authCtrl.POST = async (ctx, next) => {
  let { password } = ctx.request.body
  if (!password) {
    return handleError({ ctx, message: '密码不能为空' })
  }
  let auth = await AuthModel.findOne({})
    .select('password -_id')
    .exec()
    .catch(err => {
      handleError({ ctx, err, message: '登录失败' })
    })
  if (auth && auth.password === md5Encode(password)) {
    let token = jwt.sign({
      id: auth._id, 
      name: auth.name
    }, AUTH.SECRET_KEY, { expiresIn: AUTH.EXPIRED })
    handleSuccess({ ctx, data: { token }, message: '登录成功' })
  } else {
    handleError({ ctx, message: '禁地勿闯！！！' })
  }
}

// 修改个人信息
authCtrl.PUT = async (ctx, next) => {
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

export default async (ctx, next) => await handleRequest({ ctx, next, type: authCtrl })
