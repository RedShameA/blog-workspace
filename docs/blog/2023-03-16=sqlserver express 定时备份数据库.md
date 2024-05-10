---
title: sqlserver express 定时备份数据库
author: RedA
createTime: 2023-03-16 14:46
permalink: /article/b96sodj7/
---
## 脚本
备份目录：``` /home/norco/SqlServerBackup/baks/ ```
备份脚本：``` /home/norco/SqlServerBackup/backup.sh ```
``` bash
#/bin/bash
user=SA
passwd=Zhy@kss!
back_path=/home/norco/SqlServerBackup/baks/
db_name=drainage
back_time=`date +%Y%m%d_%H%M%S`
back_filename=$back_path$db_name$back_time
del_time=`date -d "2 day ago" +"%Y%m%d"`
del_backfile=$back_path$db_name$del_time

/opt/mssql-tools/bin/sqlcmd -S localhost -U $user -P $passwd -d master -Q "BACKUP DATABASE $db_name to disk='$back_filename.bak'"
tar -zcPf $back_filename.tar.gz $back_filename.bak
rm -f $back_filename.bak
if [ -e $back_filename.tar.gz ];then
    rm  -rf $del_backfile*.gz
    echo "database[drainage] backup success! "
else
    echo "database[drainage] backup failed!"
fi
```

## 解析
**有效备份命令**：``` /opt/mssql-tools/bin/sqlcmd -S localhost -U $user -P $passwd -d master -Q "BACKUP DATABASE $db_name to disk='$back_filename.bak'" ```

因为这个命令使用的是用户```mssql```，如果我们想在执行完备份后对他进行删除、重命名等操作的时候，是不方便的。所以需要进行一下配置。

首先创建一下备份目录 ``` mkdir /home/norco/SqlServerBackup/baks/ ```
变更目录所属用户和组 ``` chmod mssql:mssql /home/norco/SqlServerBackup/baks/ ``` 
赋予组读写权限 ``` chmod g+srwx /home/norco/SqlServerBackup/baks/ ```
将自己添加到```mssql```组 ``` sudo gpasswd -a norco mssql ```
查看自己所属组 ``` groups ```
完成后断开ssh重新连接才能够刷新组

此时即可使用备份脚本

定时``` crontab -e ```
```
* * * * * sh /home/norco/SqlServerBackup/backup.sh
```

## 其他相关
还原数据库的命令如下：
``` restore database TestDB from disk='/opt/dbbackup/TestDB.bak' ```
这是在数据库不存在的情况下使用。如果数据库存在，则需要使用如下命令进行覆盖：
``` restore database TestDB from disk='/opt/dbbackup/TestDB.bak' with replace ```
