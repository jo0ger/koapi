/**
 * @desc 音乐 api routes
 * @author Jooger
 * @date 14 Aug 2017
 */


import { musicControllers } from '../controller'
console.log(musicControllers)
const prefix = 'music'

export default router => {

  // 歌曲列表
  router.all(`${prefix}-list`, `/${prefix}/list`, musicControllers.list)

  // 歌曲详情
  router.all(`${prefix}-song`, `/${prefix}/song`, musicControllers.song)

  // 歌曲地址
  router.all(`${prefix}-url`, `/${prefix}/url`, musicControllers.url)

  // 歌词
  router.all(`${prefix}-lyric`, `/${prefix}/lyric`, musicControllers.lyric)

  // 封面图片
  router.all(`${prefix}-cover`, `/${prefix}/cover`, musicControllers.cover)
}
