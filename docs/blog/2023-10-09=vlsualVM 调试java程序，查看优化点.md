---
title: vlsualVM 调试java程序，查看优化点
author: RedA
createTime: 2023-10-09 08:59
permalink: /article/wwq9xn2n/
---
- Netty 调优: `https://blog.csdn.net/m0_37556444/article/details/108979352`

- Linux 查看连接数: `netstat -na|grep ESTABLISHED|wc -l`

- 远程调试jar包

    ```bash
    java 
    -Djava.rmi.server.hostname=192.168.1.58 
    -Dcom.sun.management.jmxremote 
    -Dcom.sun.management.jmxremote.port=10081  
    -Dcom.sun.management.jmxremote.authenticate=false 
    -Dcom.sun.management.jmxremote.ssl=false 
    -jar app.jar
    ```
  打开jdk/bin目录内jvisualvm.exe 即 visualVm 连接远程调试即可
