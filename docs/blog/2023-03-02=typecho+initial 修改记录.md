---
title: typecho+initial 修改记录
author: RedA
createTime: 2023-03-02 23:08
permalink: /article/cm2jspgw/
---
# 实现登陆后页面内“编辑按钮” 及 新增博客按钮
## post.php
面包屑div内新增
```php
<?php if($this->user->hasLogin()):?>
<a style="float: right" href="<?php $this->options->adminUrl(); ?>write-post.php?cid=<?php echo $this->cid;?>" target="_blank">🖍</a>
<?php endif;?>
```

## page.php
Breadcrumbs($this)替换为
```php
<?php if($this->user->hasLogin()):?>
<?php 
ob_start(); 
Breadcrumbs($this);
$a = ob_get_contents();
ob_end_clean();
echo substr($a,0,-7);
?>
<a style="float: right" href="<?php $this->options->adminUrl(); ?>write-post.php?cid=<?php echo $this->cid;?>" target="_blank">🖍</a></div>
<?php else:?>
<?php Breadcrumbs($this);?>
<?php endif;?>
```

### header.php
最后一个`</li>`后的两个endif后
```php
<?php if($this->user->hasLogin()):?>
<li><a href="<?php $this->options->adminUrl(); ?>write-post.php" target="_blank">🖍</a></li>
<?php endif;?>
```

## 效果图
![效果图](/blog-md-statics/2023-03-02/效果图.png)

# 发布文章默认关闭评论
## /admin/write-page.php & /admin/write-post.php

搜索关键词 `允许评论` ，将 `checked="true"` 改为 `checked="false"` 
