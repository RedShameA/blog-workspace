---
title: 记录一次MyBatis-MySql项目迁移到达梦数据库
author: RedA
createTime: 2022-12-08 23:57
permalink: /article/0mawvnw7/
---
> 2022.12，DM8。

## 迁移数据库
- 创建数据库。为了兼容一些Mysql的特性，需要进行以下创建操作。
    - 打开DM数据库配置助手
    - 到初始化参数这一栏，进行以下必要配置
    - 页大小为32K
    - 字符集为UTF-8
    - 取消勾选 字符串比较大小写敏感
    - 勾选 VARCHAR类型以字符为单位
    - 配置数据库配置文件，在"达梦安装目录/data/数据库名/dm.ini"
    - COMPATIBLE_MODE为4 ，兼容mysql语法
    - CALC_AS_DECIMAL为2，数字运算返回为小数，看齐mysql
    - DATETIME_FAST_RESTRICT改为0，兼容to_date(‘2022-01-11 11:22:33’,‘yyyy-mm-dd’)
    - 使用DM管理工具创建一个模式，用于储存被迁移的数据库

- 迁移数据库
    - 打开DM数据迁移工具，选择Mysql -> DM
    - Mysql数据库信息填写，驱动应选择最新的Mysql-connector/J
    - DM数据库信息填写，驱动应选择最新的DmJdbcDriver18，在达梦安装目录/drivers/jdbc下
    - DM数据库信息填写，使用自定义URL，jdbc:dm://xxxx:xxxx?schema=xxxx，将模式名写上
    - 选择好模式，并勾选保持对象名大小写
    - 开始迁移
    - 如出现错误：在表xxx上添加UNIQUE约束xxx_INDEX失败，则忽略即可，因为达梦不支持主键上添加UNIQUE约束，但主键本身就带有了UNIQUE的属性，所以无碍

## 项目配置达梦
- 添加达梦官方驱动
- 配置数据源为达梦

## mybtis插件自动适配一部分sql语法为达梦语法
- 简介
    - 是mybatis插件的形式，兼容mybatis plus，拦截所有sql语句
    - 所有sql，`去掉，"转换为'，表名或列名的别名 加上双引号来固定大小写
    - mysql方法修改兼容达梦
    - 其中的方法及别名修改，用到了druid sqlparser visitor
- 配置项
    - 开启插件：dm-adapter.enable=true
    - 插件debug日志开启：logging.level.com.zhy.mybatis=debug
- 插件代码
    ``` java
    public class DMSQLUtil3 {
    public static final DbType dbType = JdbcConstants.MYSQL;
    public static final MyVisitor visitor = new MyVisitor();
    private static final Logger log = LoggerFactory.getLogger(DMSQLUtil3.class);

    /**
    * 将MySql的SQL转为适配达梦语法的SQL
    * @param sql 原SQL
    * @return 转换后的SQL
    */
    public static String fit(String sql){
        // 格式化SQL 现在不进行格式化 因为需要针对sql去替换一些固定内容
        // sql = format(sql);
        // 进行通用替换
        sql = replace(sql);
        // 进行方法、别名处理
        SQLStatement statement = SQLUtils.parseSingleStatement(sql, dbType, new SQLParserFeature[0]);
        statement.accept(visitor);
        return statement.toString();
    }

    // 通用替换方法
    public static String replace(String sql){
        if (StringUtils.isNotNull(sql) && sql.indexOf("`") != -1) {
            log.debug("自动替换：「`」 => 「」");
            sql = sql.replace("`", "");
        }
        if (StringUtils.isNotNull(sql) && sql.indexOf("\"") != -1) {
            log.debug("自动替换：「\"」 => 「'」");
            sql = sql.replace("\"", "'");
        }
        if (StringUtils.isNotNull(sql) && ReUtil.contains("--(\\w)", sql)) {
            log.debug("自动替换：「--」 => 「-- 」");
            sql = ReUtil.replaceAll(sql, "--(\\w)", "-- $1");
        }


        // 指定sql拦截 BasDeviceMapper.selectBasDeviceList
        if (StringUtils.isNotNull(sql) && sql.indexOf("select tb_id code, tbmc watername from bas_tangba") != -1){
            log.debug("指定sql拦截：BasDeviceMapper.selectBasDeviceList");
            sql = sql.replace("tb_id code,", "to_char(tb_id) code,");
        }
        // 指定sql拦截 BasDeviceMapper.selectBasDeviceList
        if (StringUtils.isNotNull(sql) && sql.indexOf("sys_file f on t.url = f.id") != -1){
            log.debug("指定sql拦截：t.url = f.id");
            sql = sql.replace("t.url = f.id", "t.url = to_char(f.id)");
        }
        // 指定sql拦截 ph.photopanocon_xmlurl = x.id 和 ph.photopanocon_swfurl = s.id
        if (StringUtils.isNotNull(sql) && (sql.indexOf("ph.photopanocon_xmlurl = x.id")!=-1 || sql.indexOf("ph.photopanocon_swfurl = s.id")!=-1)){
            log.debug("指定sql拦截：ph.photopanocon_xmlurl = x.id");
            sql = sql.replace("ph.photopanocon_xmlurl = x.id", "ph.photopanocon_xmlurl = to_char(x.id)");
            sql = sql.replace("ph.photopanocon_swfurl = s.id", "ph.photopanocon_swfurl = to_char(s.id)");
        }
        // 指定sql拦截 sysMpModelsMapper.selectSysMpModelsList
        if (StringUtils.isNotNull(sql) && sql.indexOf("sys_file f on m.url = f.id") != -1){
            log.debug("指定sql拦截：sysMpModelsMapper.selectSysMpModelsList");
            sql = sql.replace("sys_file f on m.url = f.id", "sys_file f on m.url = to_char(f.id)");
        }
        return sql;
    }

    // 格式化SQL方法 小写
    public static String format(String sql, DbType dbType, boolean pretty){
        return SQLUtils.format(sql, dbType, new SQLUtils.FormatOption(false, pretty, false));
    }
    }
    ```
    ``` java
    public class MyVisitor extends MySqlASTVisitorAdapter {
    private DbType dbType = JdbcConstants.DM;
    private static final Logger log = LoggerFactory.getLogger(MyVisitor.class);


    // 替换方法
    @Override
    public boolean visit(SQLMethodInvokeExpr x) {
        try {
            translateSQLMethod2DMMethod(x);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return true;
    }
    // 替换 1=1
    @Override
    public boolean visit(SQLBinaryOpExpr x){
        SQLExpr right = x.getRight();
        if (right instanceof SQLNumericLiteralExpr){
            String intStr = SQLUtils.toSQLString(right, dbType);
            SQLExpr sqlExpr = SQLUtils.toSQLExpr("'" + intStr + "'", dbType);
            x.setRight(sqlExpr);
        }
        SQLExpr left = x.getLeft();
        if (left instanceof SQLNumericLiteralExpr){
            String intStr = SQLUtils.toSQLString(left, dbType);
            SQLExpr sqlExpr = SQLUtils.toSQLExpr("'" + intStr + "'", dbType);
            x.setLeft(sqlExpr);
        }
        return true;
    }
    // 替换别名
    @Override
    public boolean visit(SQLSelectItem x) {
        String alias = x.getAlias2();
        if (null!=alias){
            alias = alias.replace("`", "");
            log.debug("替换别名 {} => {} ", alias, "\""+ alias +"\"");
            x.setAlias("\""+ alias +"\"");
        }
        return true;
    }
    // 替换 group_concat
    @Override
    public boolean visit(SQLAggregateExpr x){

        try {
            if (x.getMethodName().toLowerCase(Locale.ROOT).equals("group_concat")){
                log.debug("替换方法 {} => {} ", "group_concat", "listagg");
                x.setMethodName("listagg");
                ArrayList<SQLExpr> newArguments = new ArrayList<>(2);
                List<SQLExpr> arguments = x.getArguments();
                // 列名
                newArguments.add(0, arguments.get(0));
                // order by
                SQLOrderBy order_by = (SQLOrderBy)x.getAttribute("ORDER BY");
                if (null != order_by){
                    x.setWithinGroup(true);
                    x.setOrderBy(order_by);
                }
                // 分隔符号
                SQLExpr separator = (SQLExpr)x.getAttribute("SEPARATOR");
                newArguments.add(1, separator==null?SQLUtils.toSQLExpr("','", dbType):separator);

                // 去除Attribute
                Field field= SQLObjectImpl.class.getDeclaredField("attributes");
                field.setAccessible(true);
                field.set(x, null);
                // 设置参数
                field= SQLMethodInvokeExpr.class.getDeclaredField("arguments");
                field.setAccessible(true);
                field.set(x, newArguments);
            }
        }catch (Exception e){
            e.printStackTrace();
        }

        return true;
    }
    // sql方法转换为达梦方法 用反射来修改参数列表
    public void translateSQLMethod2DMMethod(SQLMethodInvokeExpr expr) throws NoSuchFieldException, IllegalAccessException {
        List<SQLExpr> arguments = expr.getArguments();
        Field argumentsField= SQLMethodInvokeExpr.class.getDeclaredField("arguments");
        argumentsField.setAccessible(true);
        // if方法 转为case when
        if (expr.getMethodName().toLowerCase(Locale.ROOT).equals("if")){
            log.debug("替换方法 {} ", "if");
            String strCase = "case when true then 1 else 0 end";
            SQLCaseExpr caseExpr = (SQLCaseExpr) SQLUtils.toSQLExpr(strCase, DbType.dm);
            // 转换参数
            caseExpr.setElseExpr(arguments.get(2));
            caseExpr.getItems().get(0).setValueExpr(arguments.get(1));
            caseExpr.getItems().get(0).setConditionExpr(arguments.get(0));
            // 替换自身
            SQLUtils.replaceInParent(expr, caseExpr);
        }
        // format方法 转为round
        else if (expr.getMethodName().toLowerCase(Locale.ROOT).equals("format")){
            // 转换参数、方法名
            log.debug("替换方法 {} => {} ", "format", "round");
            expr.setMethodName("round");
        }
        // date_add and date_sub方法 转为 达梦的
        else if (expr.getMethodName().toLowerCase(Locale.ROOT).equals("date_add")
                || expr.getMethodName().toLowerCase(Locale.ROOT).equals("date_sub")){
            // 转换参数
            log.debug("替换方法 {} ", expr.getMethodName());
            SQLIntervalExpr intervalExpr = (SQLIntervalExpr) arguments.get(1);
            String newExprSQL = StrUtil.format("{}({}, INTERVAL '{}' {})",
                    expr.getMethodName(),
                    arguments.get(0), intervalExpr.getValue(), intervalExpr.getUnit());
            SQLMethodInvokeExpr newExpr = (SQLMethodInvokeExpr) SQLUtils.toSQLExpr(newExprSQL, DbType.dm);
            argumentsField.set(expr, newExpr.getArguments());
        }
    // adddate and subdate方法 转为 达梦的
        else if (expr.getMethodName().toLowerCase(Locale.ROOT).equals("adddate")
                || expr.getMethodName().toLowerCase(Locale.ROOT).equals("subdate")){
            // 转换参数
            log.debug("替换方法 {} ", expr.getMethodName());
            // 替换函数名
            if (expr.getMethodName().toLowerCase(Locale.ROOT).equals("dateadd")){
                expr.setMethodName("date_add");
            }else{
                expr.setMethodName("date_sub");
            }
            SQLExpr intervalExpr = arguments.get(1);
            if (intervalExpr instanceof SQLIntervalExpr){
                // 第二个参数是INTERVAL形式的
                String newExprSQL = StrUtil.format("{}({}, INTERVAL '{}' {})",
                        expr.getMethodName(),
                        arguments.get(0), ((SQLIntervalExpr)intervalExpr).getValue(), ((SQLIntervalExpr)intervalExpr).getUnit());
                SQLMethodInvokeExpr newExpr = (SQLMethodInvokeExpr) SQLUtils.toSQLExpr(newExprSQL, DbType.dm);
                argumentsField.set(expr, newExpr.getArguments());
            }else{
                // 第二个参数是数字形式
                String newExprSQL = StrUtil.format("{}({}, INTERVAL '{}' DAY)",
                        expr.getMethodName(),
                        arguments.get(0), intervalExpr);
                SQLMethodInvokeExpr newExpr = (SQLMethodInvokeExpr) SQLUtils.toSQLExpr(newExprSQL, DbType.dm);
                argumentsField.set(expr, newExpr.getArguments());
            }
        }
    }
    }
    ```
    ``` java
    @Component
    @ConditionalOnProperty(prefix = "dm-adapter",name = "enable",havingValue = "true")
    // @ConditionalOnBean({SqlSessionFactory.class})
    // @AutoConfigureAfter({MybatisAutoConfiguration.class})
    @Intercepts({
        @Signature(type = StatementHandler.class, method = "prepare", args = {Connection.class, Integer.class})
    })
    public class MybatisDmAdapterPlugin4 implements Interceptor {
    private Logger log = LoggerFactory.getLogger(MybatisDmAdapterPlugin4.class);
    public MybatisDmAdapterPlugin4() {
        log.info("dm-adapter加载中...");
    }

    @Override
    public Object intercept(Invocation invocation) throws Throwable {

        StatementHandler statementHandler = (StatementHandler) invocation.getTarget();

        MetaObject metaObject = SystemMetaObject.forObject(statementHandler);
        MappedStatement mappedStatement = (MappedStatement) (metaObject.getValue("delegate.mappedStatement"));
        // 先拦截到RoutingStatementHandler，里面有个StatementHandler类型的delegate变量，其实现类是BaseStatementHandler，然后就到BaseStatementHandler的成员变量mappedStatement
        // id为执行的mapper方法的全路径名，如com.cq.UserMapper.insertUser， 便于后续使用反射
        String id = mappedStatement.getId();
        // sql语句类型 select、delete、insert、update
        String sqlCommandType = mappedStatement.getSqlCommandType().toString();
        // 数据库连接信息
        // Configuration configuration = mappedStatement.getConfiguration();
        // ComboPooledDataSource dataSource = (ComboPooledDataSource)configuration.getEnvironment().getDataSource();
        // dataSource.getJdbcUrl();

        BoundSql boundSql = statementHandler.getBoundSql();
        // 获取到原始sql语句
        String oldSql = boundSql.getSql();
        // sql转达梦
        String dmSql =  DMSQLUtil3.fit(oldSql);
        //通过反射修改sql语句
        Field field = boundSql.getClass().getDeclaredField("sql");
        field.setAccessible(true);
        field.set(boundSql, dmSql);
        log.debug("dm-adapter {} sql 记录\nmapper方法：{}\n原sql：{}\n修改后sql：{}", sqlCommandType, id, DMSQLUtil3.format(oldSql, DbType.mysql, true), DMSQLUtil3.format(dmSql, DbType.dm, true));
        return invocation.proceed();
    }

    @Override
    public Object plugin(Object target) {
        return Interceptor.super.plugin(target);
    }

    @Override
    public void setProperties(Properties properties) {
        Interceptor.super.setProperties(properties);
    }

    public static boolean modified(String oldSql, String dmSql){
        oldSql = ReUtil.replaceAll(oldSql, "\\t", "");
        oldSql = ReUtil.replaceAll(oldSql, "(\\s{2,})", " ");
        oldSql = oldSql.trim();
        dmSql = ReUtil.replaceAll(dmSql, "\\t", "");
        dmSql = ReUtil.replaceAll(dmSql, "(\\s{2,})", " ");
        dmSql = dmSql.trim();
        return !oldSql.equalsIgnoreCase(dmSql);
    }
    }
    ```

## 测试项目，手动修改剩余不兼容部分，下面是我遇到的
- ~~mapper xml文件里 注释尽量用 或 /* xxx */，如使用--时，注意后面要紧跟一个空格，如 -- xxx，否则 将--str 当作负负str，会报字符串转换失败~~
- ~~将时间传入sql内的时候，应传入date类型而非String~~
- ~~IF函数，注意if函数的后两个参数类型，要相同~~ 现在可以完全转换为大梦支持的格式了
- ~~尽量使用达梦的函数进行开发，达梦与Oracle类似，可以参考Oracle函数~~
- 在sql中，text、varchar的列不能和int、bigint的列进行比较。如a.url = b.id，会报错，引文text和bigint比较了
- 不要出现相同的列名，如 select column1 as a, column2 as a，在mysql里会自动将第二个a变为a1，但达梦会报错
- 不要给自增列(主键)赋值。如运管-养护维修-维修管理-维修类型 模块内，维修单号是必填，但却是主键，这种的可以为维修单号新建一个列来储存。如果硬要自增+指定，建议新建一个列，在代码内处理 如果没填写自增列，就手动select列最大值+1来赋值
- 更新的时候不要同时更新两个表，达梦不支持，如 update a,b set a.column=1, b.column=1 where a.id=b.id and b.id=1；达梦支持更新的时候联查，若要更新多个表，可以分成两个sql来更新，用事务来保证一致性。
- 时间类型和文本类型的时间可以比较，但只允许格式： 2022-12-08 15:46:19.628、2022-12-08 15:46:19、2022-12-08。 其他格式使用前请自行测试。
- mysql迁移达梦之后，会有一些类型转换，如Double->Number，在Java实体类中可以正常转换为Double，但如果返回的是Map<String, object>，此时按照之前类型的进行强转就会报错。
- 注意不要把关键字作为列名，表名以及别名
