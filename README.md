# koapi

My blog's api server build by koa2 and mongoose

## 目录结构

采用[runkoa](https://github.com/17koa/runkoa)构建

```
koapi
│  app.js               // 程序启动文件
│   
├─bin                   // runkoa script目录
│      run              // runkoa 入口
│      www              // runkoa执行脚本
│      
├─config                // 程序配置文件
│      
├─controller            // Controllers
│      
├─logs                  // 日志
│      
├─middleware            // 中间件
│      auth.js          // 权限校验文件
│      
├─model                 // mongoose models
│      
├─mongoose              // mongoose包装
│              
├─routes                // 路由
│      
└─util                  // 常用工具
        
```
## TODOS

* 网易云音乐代理 [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)
* github项目代理
* 七牛云代理优化
* VPS Server 监控本地可视化
* 博客sitemap
* 评论/回复会放松邮件给评论/回复作者 [nodemailer]
(https://github.com/nodemailer/nodemailer)
* 评论显示“同城”
* 评论反垃圾 [akismet](https://github.com/chrisfosterelli/akismet-api)
* 评论加入位置定位 [geoip](https://github.com/bluesmoon/node-geoip)
