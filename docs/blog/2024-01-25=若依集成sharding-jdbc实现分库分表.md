---
title: 若依集成sharding-jdbc实现分库分表
author: RedA
createTime: 2024-01-25 19:51
permalink: /article/w8n5zp7x/
---
> sharding-jdbc版本5.4.1，springboot版本2.5.15

### 集成

- 在framework模块下pom里增加sharding-jdbc依赖
  ```xml
  <!-- 分库分表 -->
  <dependency>
      <groupId>org.apache.shardingsphere</groupId>
      <artifactId>shardingsphere-jdbc-core</artifactId>
      <version>5.4.1</version>
  </dependency>
  ```
- 修改common.enums.DataSourceType，增加SHARDING数据源
- 修改方法framework.config.DruidConfig#dataSource，增加一行代码
  ```java
  setDataSource(targetDataSources, DataSourceType.SHARDING.name(), "shardingDataSource");
  ```
- 在framework模块下增加类framework.config.ShardingDataSourceConfig，内容如下
  ```java
  package com.zhy.framework.config;
  
  import org.apache.shardingsphere.driver.api.ShardingSphereDataSourceFactory;
  import org.apache.shardingsphere.infra.config.algorithm.AlgorithmConfiguration;
  import org.apache.shardingsphere.sharding.api.config.ShardingRuleConfiguration;
  import org.apache.shardingsphere.sharding.api.config.rule.ShardingAutoTableRuleConfiguration;
  import org.apache.shardingsphere.sharding.api.config.rule.ShardingTableReferenceRuleConfiguration;
  import org.apache.shardingsphere.sharding.api.config.rule.ShardingTableRuleConfiguration;
  import org.apache.shardingsphere.sharding.api.config.strategy.keygen.KeyGenerateStrategyConfiguration;
  import org.apache.shardingsphere.sharding.api.config.strategy.sharding.StandardShardingStrategyConfiguration;
  import org.springframework.beans.factory.annotation.Qualifier;
  import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
  import org.springframework.context.annotation.Bean;
  import org.springframework.context.annotation.Configuration;
  
  import javax.sql.DataSource;
  import java.sql.SQLException;
  import java.util.Collections;
  import java.util.HashMap;
  import java.util.Map;
  import java.util.Properties;
  
  /**
   * @author wangfeng
   * @since 2023-11-29 11:30
   */
  
  @Configuration
  public class ShardingDataSourceConfig {
  
  
      /**
       * 当对应配置启用的时候，以master参数为数据库参数，创建分库分表的数据源DataSource
       *
       * @param masterDataSource 配置文件里的数据源
       * @return 分库分表的数据源
       * @throws SQLException 异常
       */
      @Bean(name = "shardingDataSource")
      @ConditionalOnProperty(prefix = "spring.datasource.druid.sharding", name = "enabled", havingValue = "true")
      public DataSource shardingDataSource(@Qualifier("masterDataSource") DataSource masterDataSource) throws SQLException {
          Map<String, DataSource> dataSourceMap = new HashMap<>();
          dataSourceMap.put("master", masterDataSource);
          // 获取数据源对象
          return ShardingSphereDataSourceFactory.createDataSource(dataSourceMap, Collections.singleton(createShardingRuleConfiguration()), getProperties());
      }
  
      /**
       * sharding-jdbc系统参数配置
       * 主要配置了控制台打印sql
       */
      private Properties getProperties() {
          Properties shardingProperties = new Properties();
          shardingProperties.put("sql.show", true);
          shardingProperties.put("sql-show", true);
          return shardingProperties;
      }
  
      /**
       * 以Java代码的形式生成分库分表规则 <br>
       * 这是以时间分表，自动填充雪花ID的配置 <br>
       * 其他配置可以参考<a href="https://shardingsphere.apache.org/document/5.4.1/cn/user-manual/shardingsphere-jdbc/java-api/">官方文档</a> <br>
       * 在[用户手册 - shardingsphere-jdbc - JavaAPI]下，是以Java代码方式创建配置的教程
       */
      private ShardingRuleConfiguration createShardingRuleConfiguration() {
          // 配置文件-根
          ShardingRuleConfiguration result = new ShardingRuleConfiguration();
          result.getBindingTableGroups().
                  add(new ShardingTableReferenceRuleConfiguration("things_data_his_group", "things_data_his"));
          // 配置主键生成
          result.getKeyGenerators().put("snowflake", new AlgorithmConfiguration("SNOWFLAKE", new Properties()));
          // 配置切片算法
          result.getShardingAlgorithms().put("range_by_time", new AlgorithmConfiguration("AUTO_INTERVAL", getAutoIntervalAlgorithmsProperties()));
          //result.getShardingAlgorithms().put("range_by_month", new AlgorithmConfiguration("INTERVAL", getIntervalAlgorithmsProperties()));
          // 配置table切片规则
          result.getAutoTables().add(getThingsDataHisTableAutoIntervalRuleConfiguration());
          //result.setDefaultDatabaseShardingStrategy(new StandardShardingStrategyConfiguration("value_time", "range_by_time"));
          return result;
      }
  
      /**
       * 抽离规则生成方法
       */
      private static Properties getAutoIntervalAlgorithmsProperties() {
          Properties intervalAlgorithmsProperties = new Properties();
          intervalAlgorithmsProperties.put("datetime-lower", "2023-01-01 00:00:00");
          intervalAlgorithmsProperties.put("datetime-upper", "2025-01-01 00:00:00");
          intervalAlgorithmsProperties.put("sharding-seconds", 60 * 60 * 24 * 60); //60天
          return intervalAlgorithmsProperties;
      }
  
      /**
       * 抽离规则生成方法
       */
      private static Properties getIntervalAlgorithmsProperties() {
          Properties intervalAlgorithmsProperties = new Properties();
          intervalAlgorithmsProperties.put("datetime-pattern", "yyyy-MM-dd HH:mm:ss");
          intervalAlgorithmsProperties.put("datetime-lower", "2023-01-01 00:00:00");
          intervalAlgorithmsProperties.put("datetime-upper", "2025-01-01 00:00:00");
          intervalAlgorithmsProperties.put("sharding-suffix-pattern", "yyyy_MM");
          intervalAlgorithmsProperties.put("datetime-interval-amount", "1");
          intervalAlgorithmsProperties.put("datetime-interval-unit", "MONTHS");
          return intervalAlgorithmsProperties;
      }
  
      /**
       * 抽离规则生成方法
       */
      private static ShardingAutoTableRuleConfiguration getThingsDataHisTableAutoIntervalRuleConfiguration() {
          ShardingAutoTableRuleConfiguration tableRuleConfiguration =
                  new ShardingAutoTableRuleConfiguration(
                          "things_data_his",
                          "master"
                  );
  
          tableRuleConfiguration.setKeyGenerateStrategy(new KeyGenerateStrategyConfiguration("id", "snowflake"));
          tableRuleConfiguration.setShardingStrategy(new StandardShardingStrategyConfiguration("value_time", "range_by_time"));
          return tableRuleConfiguration;
      }
  
      /**
       * 抽离规则生成方法
       */
      private static ShardingTableRuleConfiguration getThingsDataHisTableRuleConfiguration() {
          ShardingTableRuleConfiguration tableRuleConfiguration =
                  new ShardingTableRuleConfiguration(
                          "things_data_his",
                          "master.things_data_his_202${['3','4']}_$->{['01','02','03','04','05','06','07','08','09','10','11','12']}"
                  );
          tableRuleConfiguration.setKeyGenerateStrategy(new KeyGenerateStrategyConfiguration("id", "snowflake"));
          tableRuleConfiguration.setTableShardingStrategy(new StandardShardingStrategyConfiguration("value_time", "range_by_month"));
          return tableRuleConfiguration;
      }
  }
  
  ```

### 使用

参考若依的数据源使用方法，切换到Sharding数据源，在插入配置中的库或表的时候，会自动分库分表。
