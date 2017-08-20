/**
 * @desc logger
 * @author Jooger
 */
const simpleNodeLogger = require('simple-node-logger')
const timestampFormat = 'YYYY-MM-DD HH:mm:ss'

const logger = (process.env.NODE_ENV === 'production' && process.env.log)
  ? simpleNodeLogger.createRollingFileLogger({
    timestampFormat,
    logDirectory: './logs',
    fileNamePattern: '<DATE>.log'
  })
  : new simpleNodeLogger.createSimpleLogger({
    timestampFormat,
  })

export default logger
