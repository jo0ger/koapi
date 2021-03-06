const packageConfig = require('./package.json')

module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    // First application
    {
      name      : packageConfig.name,
      script    : './bin/run',
      env: {
        COMMON_VARIABLE: 'true'
      },
      env_production : {
        NODE_ENV: 'production'
      }
    }
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy : {
    production : {
      user : 'root',
      host : 'jooger.me',
      ref  : 'origin/master',
      repo : packageConfig.repository.url,
      path : '/var/www/' + packageConfig.name,
      'post-deploy' : 'npm install && pm2 stop all && npm run build && pm2 reload ecosystem.config.js --env production && pm2 start all'
    }
  }
}
