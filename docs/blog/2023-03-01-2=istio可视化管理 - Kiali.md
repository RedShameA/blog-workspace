---
title: istio可视化管理 - Kiali
author: RedA
createTime: 2023-03-01 16:14
permalink: /article/cy5lffmn/
---
## 1. 安装 Kiali
首先下载资源清单文件并解压 [samples.zip](/blog-md-statics/2023-03-01-2/samples.zip)

### 安装
```bash 
$ kubectl apply -f samples/addons

serviceaccount/grafana created
configmap/grafana created
service/grafana created
deployment.apps/grafana created
configmap/istio-grafana-dashboards created
configmap/istio-services-grafana-dashboards created
deployment.apps/jaeger created
service/tracing created
service/zipkin created
service/jaeger-collector created
serviceaccount/kiali created
configmap/kiali created
clusterrole.rbac.authorization.k8s.io/kiali-viewer created
clusterrole.rbac.authorization.k8s.io/kiali created
clusterrolebinding.rbac.authorization.k8s.io/kiali created
role.rbac.authorization.k8s.io/kiali-controlplane created
rolebinding.rbac.authorization.k8s.io/kiali-controlplane created
service/kiali created
deployment.apps/kiali created
serviceaccount/prometheus created
configmap/prometheus created
clusterrole.rbac.authorization.k8s.io/prometheus created
clusterrolebinding.rbac.authorization.k8s.io/prometheus created
service/prometheus created
deployment.apps/prometheus created
```

### 等待安装完毕
```bash
$ kubectl rollout status deployment/kiali -n istio-system

deployment "kiali" successfully rolled out
```
### 启动kiali
```bash
$ istioctl dashboard kiali

http://localhost:20001/kiali
```
![kiali首页](/blog-md-statics/2023-03-01-2/kiali首页.png)
