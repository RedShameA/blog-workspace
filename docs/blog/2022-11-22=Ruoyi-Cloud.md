---
title: Ruoyi-Cloud
author: RedA
createTime: 2022-11-22 14:59
permalink: /article/zfmsup6e/
---
## sentinel 限流熔断
  - sentinel异常熔断规则无效(在common-security GlobalExceptionHandler)
    因为若依有统一异常处理，所以sentinel无法感知到异常，需要手动通知sentinel：在@RestControllerAdvice内适当的位置加上com.alibaba.csp.sentinel.Tracer.tracer(e)（需要额外引入依赖）
- 统一限流/熔断提醒(放在了common-security 不能带SentinelResource注解，否则报错找不到限流/熔断方法)
    实现BlockExceptionHandler，通过识别参数BlockException的类型，来返回消息。
    - FlowException 限流
    - DegradeException 降级
    - ParamFlowException 热点参数限流
    - SystemBlockException 系统规则（负载/...不满足要求）
    - AuthorityException 授权规则不通过
    ```java
    // http状态码
    httpServletResponse.setStatus(500);
    httpServletResponse.setCharacterEncoding("utf-8");
    httpServletResponse.setHeader("Content-Type", "application/json;charset=utf-8");
    httpServletResponse.setContentType("application/json;charset=utf-8");
    // 返回错误信息
    new ObjectMapper().writeValue(httpServletResponse.getWriter(), AjaxResult.error(msg));
    ```
- 也可自定义方法级别限流/熔断提示，会覆盖统一的方法
    ```java
    // 放在目标方法上
    @SentinelResource(value = "test", blockHandlerClass = CustomerBlockHandler.class, blockHandler = "blockHandler", fallbackClass = CustomerBlockHandler.class, fallback = "fallbackHandler")
    // 单独的限流/熔断 方法类
    public class CustomerBlockHandler {
            // 方法需要与目标方法同返回类型、同参数
            public static int blockHandler(Long id, BlockException exception){
                    //return AjaxResult.error("block handler");
                    return 1001;
            }
    
            public static int fallbackHandler(Long id, BlockException exception){
                    //return   AjaxResult.error("fallback handler");
                    return 1002;
            }
    }

    ```


## 远程调用
- Get的@RequsestParam、@PathVariable和Post的@RequestData等等一定要带上
- @FeignClient()中value和name属性，是等价的，表示要调用的服务名。
- 因为是直接调用目标服务，所以就不要带上给gateway区别服务的那一层url了


## seata分布式事务
- 1.4.2之后，可以把配置文件合并成一个配置文件放在nacos上，不用再分散了。配置好config.nacos.data-id
- seata可以分集群，seata自己的配置文件里registry.cluster来配置属于哪个集群，再用v-groupMapping来配置**每个客户端**去请求哪个集群。
- 配置好nacos之后，关于v-groupMapping，其实就只在nacos的配置文件读取了（第一条所说的），在client端、service端的配置文件内配置是无效的。
- 要在第一个发起分布式事务发service方法上加@GlobalTransactional

## skyWalking 链路追踪
- 需要每个服务都配置才能检测到