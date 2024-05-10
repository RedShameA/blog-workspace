---
title: 解决不同包类同名导致SpringBoot启动不了的问题
author: RedA
createTime: 2023-10-09 14:16
permalink: /article/9uphagaj/
---
以全类名作为bean的默认name

    ```java
    public static void main(String[] args) {
        new SpringApplicationBuilder(HydCollectApplication.class)
                .beanNameGenerator(new CustomUniqueBeanNameGenerator())
                .run(args);
    }

    /**
     * 解决bean同名导致启动不了的问题
     */
    private static class CustomUniqueBeanNameGenerator extends AnnotationBeanNameGenerator {
        @NotNull
        @Override
        public String generateBeanName(@NotNull BeanDefinition definition, @NotNull BeanDefinitionRegistry registry) {
            return Objects.requireNonNull(definition.getBeanClassName());
        }
    }
    ```
