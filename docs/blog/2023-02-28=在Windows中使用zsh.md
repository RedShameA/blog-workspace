---
title: 在Windows中使用zsh
author: RedA
createTime: 2023-02-28 14:18
permalink: /article/pknqq0kc/
---
> 参考：[Windows安装真正的zsh——不是在WSL子系统下哦~](https://blog.csdn.net/Chuancey_CC/article/details/118223562)、[一文完成 Windows Terminal 设置与 zsh 安装【非WSL】](https://www.cnblogs.com/laugh12321/p/15788324.html)
1. 下载安装msys2
    首先下载最新版本：[下载地址](https://repo.msys2.org/distrib/x86_64/)，然后一路安装。
2. 配置zsh
    - 安装zsh
        ```bash
        pacman -S zsh
        ```
    - 自动启动zsh
        ```bash
        vim ~/.bashrc
        增加 exec zsh
        ```
    - 安装oh-my-zsh
        ```bash
        pacman -S git
        git clone https://github.com/robbyrussell/oh-my-zsh.git ~/.oh-my-zsh
        cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc
        ```
    - 安装zsh插件
        ```bash
        cd $HOME/.oh-my-zsh/plugins
        git clone https://github.com/zsh-users/zsh-autosuggestions.git
        vim ~/.zshrc
        #plugins=(git zsh-autosuggestions)
        ```
3. 配置Windows Terminal
    - 设置-添加新配置文件-命令行
        ```
        D:/msys64/msys2_shell.cmd -ucrt64 -defterm -no-start -full-path
        ```
    
4. 其他
    - 支持kubectl 补全
    ```
    source <(kubectl completion zsh)
    ```