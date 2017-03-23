const isProd = process.env.NODE_ENV === 'production'
const simpleNodeLogger = require('simple-node-logger')
const timestampFormat = 'YYYY-MM-DD HH:mm:ss'

const logger = isProd
  ? simpleNodeLogger.createRollingFileLogger({
    timestampFormat,
    logDirectory: './logs',
    fileNamePattern: 'koapi-<DATE>.log'
  })
  : simpleNodeLogger.createSimpleLogger({
    timestampFormat,
  })

export default logger
