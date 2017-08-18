/**
 * @desc 
 * @author Jooger
 * @email zzy1198258955@163.com
 * @date 18 Aug 2017
 */

import akismet from 'akismet-api'
import Validator from './validator'

const validateConfig = {
  apiKey: {
    type: 'string',
    required: true,
    message: 'Akismet的apikey不存在，服务启动失败'
  },
  activeSites: {
    type: 'array',
    message: {
      type: 'Akismet服务未配置待监控站点'
    }
  }
}
const validator = new Validator(validateConfig)

let clientPool = {}
let isValidKey = false
let loading = null

class AkismetClient {
  constructor (key, site) {
    this.key = key
    this.site = site
    this.initClient()
  }

  initClient () {
    this.client = akismet.client({
      key: this.key,
      blog: this.site
    })
  }

  async verifyKey () {
    let valid = true
    if (!isValidKey) {
      await this.client.verifyKey().then(v => {
        valid = v
        if (v) {
          isValidKey = true
          logger.info(`Akismet的apikey: ${this.key} 有效`)
        } else {
          logger.warn(`Akismet的apikey: ${this.key} 无效`)
          this.client = null
        }
      }).catch(err => logger.warn(`Akismet的apikey验证失败, err: ${err.message}`))
    }
    return { valid, client: this }
  }

  // 检测是否是spam
  async checkSpam (opt = {}) {
    logger.info('Akismet 验证评论中...')
    await new Promise((resolve, reject) => {
      if (isValidKey) {
        this.client.checkSpam(opt, (err, spam) => {
          if (err) {
            return resolve(err)
          }
          if (spam) {
            logger.error('Akismet 验证不通过，疑似垃圾评论')
            reject(new Error('疑似垃圾评论'))
          } else {
            logger.info('Akismet 验证通过')
            resolve(spam)
          }
        })
      } else {
        logger.warn(`Akismet的apikey未认证，将跳过spam验证`)
        resolve(false)
      }
    })
  }

  // 提交被误检为正常评论的spam
  async submitSpam (opt = {}) {}

  // 提交被误检为spam的正常评论
  async submitHam (opt = {}) {}
}

export const updateAkismetClient = async () => {
  isValidKey = false
  clientPool = {}
  await generateClientPool(true)
}

export const generateAkismetClient = async (update = false) => {
  const akismetConfig = config.thirdParty.akismet
  const { success, message } = validator.validate(akismetConfig)
  if (!success) {
    return logger.info(message)
  }
  const { apiKey, activeSites } = akismetConfig
  for (let i = 0; i < activeSites.length; i++) {
    const site = activeSites[i]
    if (site) {
      if (isValidKey) {
        clientPool[site] = new AkismetClient(apiKey, site)
      } else {
        const { valid, client } = await new AkismetClient(apiKey, site).verifyKey()
        if (valid) {
          clientPool[site] = client
        }
      }
    }
  }
  logger.info(`Akismet服务${update ? '更新' : '启动'}成功`)
}

export default function getAkismetClient (site) {
  const matched = Object.keys(clientPool).find(key => key.includes(site))
  if (!matched) {
    logger.info(`未找到 ${site} 的Akismet配置，将跳过spam验证`)
    return null
  }
  return clientPool[site]
}