/**
 * @desc logger
 * @author Jooger
 */

const simpleNodeLogger = require('simple-node-logger')
const timestampFormat = 'YYYY-MM-DD HH:mm:ss'

const logger = process.env.NODE_ENV === 'production'
  ? simpleNodeLogger.createRollingFileLogger({
    timestampFormat,
    logDirectory: './logs',
    fileNamePattern: 'koapi-<DATE>.log'
  })
  : simpleNodeLogger.createSimpleLogger({
    timestampFormat,
  })

export default logger
