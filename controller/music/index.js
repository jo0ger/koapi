/**
 * @desc 音乐处理
 * @author Jooger
 * @date 14 Aug 2017
 */

import NeteseMusic from 'simple-netease-cloud-music'
import { handleRequest, handleSuccess, handleError, Validator } from '../../utils'

const neteaseMusic = new NeteseMusic()
const musicCtrl = {
  list: {},
  song: {},
  url: {},
  cover: {},
  lyric: {}
}
const validateConfig = {
  playListId: {
    type: 'string',
    required: true,
    message: '歌单ID不能为空'
  },
  songId: {
    type: 'string',
    required: true,
    message: '歌曲ID不能为空'
  },
  coverId: {
    type: 'string',
    required: true,
    message: '封面图片ID不能为空'
  }
}
const validator = new Validator(validateConfig)

musicCtrl.list.GET = async (ctx, next) => {
  const { playListId } = ctx.query
  const { success, message } = validator.validate(ctx.query, 'playListId')
  if (!success) {
    return handleError({ ctx, message })
  }

  const { playlist } = await neteaseMusic.playlist(playListId)
  handleSuccess({ ctx, data: playlist, message: '歌单列表获取成功' })
}

musicCtrl.song.GET = async (ctx, next) => {
  const { songId } = ctx.query
  const { success, message } = validator.validate(ctx.query, 'songId')
  if (!success) {
    return handleError({ ctx, message })
  }

  const { songs } = await neteaseMusic.song(songId)
  handleSuccess({ ctx, data: songs, message: '歌曲信息获取成功' })
}

musicCtrl.url.GET = async (ctx, next) => {
  const { songId } = ctx.query
  const { success, message } = validator.validate(ctx.query, 'songId')
  if (!success) {
    return handleError({ ctx, message })
  }

  const data = await neteaseMusic.url(songId)
  handleSuccess({ ctx, data: data.data, message: '歌曲地址获取成功' })
}

musicCtrl.cover.GET = async (ctx, next) => {
  const { coverId } = ctx.query
  const { success, message } = validator.validate(ctx.query, 'coverId')
  if (!success) {
    return handleError({ ctx, message })
  }

  const data = await neteaseMusic.picture(coverId)
  handleSuccess({ ctx, data, message: '封面图片获取成功' })
}

musicCtrl.lyric.GET = async (ctx, next) => {
  const { songId } = ctx.query
  const { success, message } = validator.validate(ctx.query, 'songId')
  if (!success) {
    return handleError({ ctx, message })
  }

  const data = await neteaseMusic.lyric(songId)
  handleSuccess({ ctx, data, message: '歌词获取成功' })
}

export default {
  list: async (ctx, next) => await handleRequest({ ctx, next, type: musicCtrl.list }),
  song: async (ctx, next) => await handleRequest({ ctx, next, type: musicCtrl.song }),
  url: async (ctx, next) => await handleRequest({ ctx, next, type: musicCtrl.url }),
  cover: async (ctx, next) => await handleRequest({ ctx, next, type: musicCtrl.cover }),
  lyric: async (ctx, next) => await handleRequest({ ctx, next, type: musicCtrl.lyric })
}
