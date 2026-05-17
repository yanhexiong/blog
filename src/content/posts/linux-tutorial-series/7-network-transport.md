---
title: 7.计算机网络（3）
published: 2026-05-17
description: 计算机网络（3）。
hideFromLists: true
tags: ["Linux", "教程", "计算机网络"]
category: 教程
draft: false
---

本节讲的内容有些杂，主要涉及DHCP，端口，基本代理等，也会涵盖一部分建站内容。

其实讲计网不用抓包工具解析数据，观察数据结构是有些误人子弟的，后面我再想办法完善。


## 参考视频

【DHCP运作原理和握手过程】
 https://www.bilibili.com/video/BV1Gd4y1n7Xz/?share_source=copy_web&vd_source=5f0f8df2b23f338fa075d67315568bf5

【HTTPS是什么？加密原理和证书。SSL/TLS握手过程】 
https://www.bilibili.com/video/BV1KY411x7Jp/?share_source=copy_web&vd_source=5f0f8df2b23f338fa075d67315568bf5

【端口是什么？】 
https://www.bilibili.com/video/BV19ifoBcEqu/?share_source=copy_web&vd_source=5f0f8df2b23f338fa075d67315568bf5

【【中字】如何看懂一个网址（URL）？】 
https://www.bilibili.com/video/BV1EwSXBiEo4/?share_source=copy_web&vd_source=5f0f8df2b23f338fa075d67315568bf5

【科普一下：代理服务器与VPN】 
https://www.bilibili.com/video/BV1dC411z7et/?share_source=copy_web&vd_source=5f0f8df2b23f338fa075d67315568bf5

【Nginx入门必须懂3大功能配置 - Web服务器/反向代理/负载均衡】 
https://www.bilibili.com/video/BV1TZ421b7SD/?share_source=copy_web&vd_source=5f0f8df2b23f338fa075d67315568bf5
## 强调一下

1. 0.0.0.0和127.0.0.1的区别不用多说，后面跟上端口号才可以认为是成功访问了服务。（http://127.0.0.1 这种是默认http协议走80端口，所以算是隐藏了端口号）
2. 实验室的路由器就是DHCP上网方式，河海大学的校园网同样是DHCP方式分配IP。
3. 若有建站需求，建站的时候注意网络安全问题，建议通过区别设置监听地址和反向代理保护数据。

## 练习题

实践题（标注命令和对应输出结果）：
1. 使用Python的任一后端框架，设置一个服务，服务监听地址是127.0.0.1，端口是8080。访问 127.0.0.1:8080/try ，发送任意请求query（也可以为空），返回一个response：{'test':'Hello World'}， 在当前主机尝试触发这个response。
2. 使用同局域网（校园网）的其他主机访问当前服务，使用WSL，在NAT，Mirrored模式下访问当前服务，比较三种情况的服务连通性。

简答题
1. 解析实践题第二题，三种情况的能否连通服务的原因。
2. 为了保护网站数据，对于数据库等不对外公开的服务，他的监听地址是？网站的前端服务，他的监听地址是？若引入反向代理，他的监听地址是？ 
3. 访问 https://www.microsoft.com/en-us/microsoft-365/word?msockid=3f4e123f9fea6c3a1629063b9e386db3 这个URL时，发送了什么请求query？当前页面语言是？若在只更改URL的情况下，把页面语言改为中文，则应该怎么改？

思考题（附分析过程和思路）
1. 请从安全性上分析反向代理工具。
2. 当你使用了代理IP访问服务时，你的源IP会泄漏吗？通过什么方式泄漏？
3. 若要在内地能够正常使用代理节点（这里特指梯子），一个最重要的前提访问条件是什么？没有这个条件可以通过其他方式解决吗？

## 评论区作答模板

建议大家复制下面的 Markdown 模板，到评论区直接填写自己的命令、结果和判断依据：

```md
## 实践题

1. 使用 Python 的任一后端框架，设置一个服务，服务监听地址是 `127.0.0.1`，端口是 `8080`。访问 `127.0.0.1:8080/try`，发送任意请求 query（也可以为空），返回一个 response：`{'test':'Hello World'}`，在当前主机尝试触发这个 response。
   - 命令：
   - 输出解读：

2. 使用同局域网（校园网）的其他主机访问当前服务，使用 WSL，在 NAT、Mirrored 模式下访问当前服务，比较三种情况的服务连通性。
   - 命令：
   - 输出解读：

## 简答题

1. 解析实践题第二题，三种情况的能否连通服务的原因。
   - 回答：

2. 为了保护网站数据，对于数据库等不对外公开的服务，它的监听地址是？网站的前端服务，它的监听地址是？若引入反向代理，它的监听地址是？
   - 回答：

3. 访问 `https://www.microsoft.com/en-us/microsoft-365/word?msockid=3f4e123f9fea6c3a1629063b9e386db3` 这个 URL 时，发送了什么请求 query？当前页面语言是？若在只更改 URL 的情况下，把页面语言改为中文，则应该怎么改？
   - 回答：

## 思考题

1. 请从安全性上分析反向代理工具。
   - 回答：

2. 当你使用了代理 IP 访问服务时，你的源 IP 会泄漏吗？通过什么方式泄漏？
   - 回答：

3. 若要在内地能够正常使用代理节点（这里特指梯子），一个最重要的前提访问条件是什么？没有这个条件可以通过其他方式解决吗？
   - 回答：
```
