const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')();
const convert = require('koa-convert');
const bodyparser = require('koa-bodyparser')();
const httpLogger = require('koa-logger');
const logger = require('simple-node-logger').createSimpleLogger()
const minimist = require('minimist')

const config = require('./config')
const db = require('./mongoose')
const index = require('./routes/index');
const users = require('./routes/users');

// 数据库连接
db.init()

// 全局logger
global.logger = logger

// middlewares
app.use(bodyparser);
app.use(httpLogger());

// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

router.use('/', index.routes(), index.allowedMethods());
router.use('/users', users.routes(), users.allowedMethods());

app.use(router.routes(), router.allowedMethods());
// response

app.on('error', function(err, ctx){
  console.log(err)
  httpLogger.error('server error', err, ctx);
});

// 设置 Cookie 签名密钥
// 签名密钥只在配置项 signed 参数为真是才会生效
app.keys = [config.AUTH.SECRET_KEY]

module.exports = app;