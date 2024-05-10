---
title: Docker打包springboot 镜像
author: RedA
createTime: 2023-06-05 21:15
permalink: /article/2oxyugez/
---
首先maven:package
##docker

新建dockerfile
```Dockerfile
FROM openjdk:19
ADD ./target/empty-spring-boot-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```
打包
```
docker build -t empty:v0.1 .
```
运行
```
docker run -d --name emptyv0.1 empty:v0.1
```

##docker-compose

新建docker-compose.yml（打包并运行）
```
version: '3'
services:
  web:
    build: .
    ports:
    - "8080:8080"
    volumes:
      - ./src/main/resources/application.properties:/application.properties
    restart: always
```
###docker-compose常用命令
- docker-compose build (先build再up -d 即 更新镜像并重启)
- docker-compose up -d （如果镜像有更新 就会重启 否则不会）
- docker-compose restart (单纯重启镜像)
