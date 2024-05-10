---
title: springboot log 配置
author: RedA
createTime: 2023-06-30 17:31
permalink: /article/01tymm8c/
---
```
logging:
  level:
    root: info
    com:
      zhy:
        collect: info
  file:
    name: ./logs/app.log
  charset:
    console: UTF-8
    file: UTF-8
  logback:
    rollingpolicy:
      max-file-size: 200MB
      total-size-cap: 10GB
      max-history: 15
      file-name-pattern: ./logs/%d{yyyy-MM-dd}.%i-app.log.gz
```
