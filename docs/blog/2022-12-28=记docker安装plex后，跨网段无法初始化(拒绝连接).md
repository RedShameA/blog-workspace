---
title: 记docker安装plex后，跨网段无法初始化(拒绝连接)
author: RedA
createTime: 2022-12-28 00:12
permalink: /article/3kjyb5a2/
---
## 原因
不同网段不能进行初始化，plex网段：docker的172.17.0.x 电脑网段：192.168.x.x
ps: 新装plex只有4分钟时间去claim安装

## 解决
### ssh tunnel代理
ssh -L 8088:172.17.0.2:32400 reda@192.168.0.46
可能会出现 channel 4: open failed: administratively prohibited: open failed
    - sudo vi /etc/ssh/sshd_config
    - 修改AllowTcpForwarding no 为 yes
访问127.0.0.1:8088 开始安装
