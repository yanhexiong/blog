---
title: 5.计算机网络-1
published: 2026-04-30
description: 计算机网络-1。
hideFromLists: true
tags: ["Linux", "教程", "计算机网络"]
category: 教程
draft: false
---

计网就放大约3-4节内容来讲。

本节的习题内容不会太多，主要是开个头，让大家知道要学啥：

## 参考书籍

参考计算机网络第八版（谢希仁），我在写教程的时候也是第一次看到计网的书，咱们结合理论知识，拿这个教材的目录抛砖引玉一下：
不是所有都要学，毕竟咱们是以实践为主，但基本的东西都要知道。

计算机网络第八版（谢希仁）目录：
1. 概述：讲一些计网基本知识，大家也都是科班的，后面强调一下即可。
2. 物理层：跟咱们实践没啥关系，跳过就行。（知道网络是用数据线连起来的即可。）
3. 数据链路层：同上，不做实践部分重点，都是理论内容。
4. 网络层：重点讲解部分，讲了IPV4,IPV6,MAC地址,各种网络层协议，VPN和NAT。
5. 运输层：知道TCP和UDP的区别就行，想再深一层就学拥塞控制和两种协议的工作内容。
6. 应用层：讲了DNS,互联网,URL,EMAIL,DHCP和P2P等，和网络层都算本次重点讲解部分。
7. 网络安全：理解并学会使用防火墙，密钥即可。
8. 互联网上的音/视频服务：讲流失传输，调度等相关内容，不做重点。
9. 无线网络和移动网络：通信工程相关内容，知道基本的无线网络知识，学会优化无线网即可。

综上，其实实践部分的内容就这些，整本书的内容讲的基本都是理论部分，没有涉及网络设备的使用和配置等一些很实际的操作内容，毕竟网络运维这个岗位也不需要学太深的理论（难绷），对于个人学业发展而言，会看IP,URL,建站(静态/动态域名解析和反向代理),配置路由器/交换机,加密代理,P2P,理解网络拓扑,测连通性这些基本上就能够让你轻松入门这本书了，且本科，研究生阶段都不会涉及到之外的内容，学会理论部分那就是锦上添花了。

本节内容很简单：有一些理论内容需要掌握，会看IP,MAC地址，测IP连通性即可。视频较长，大家有时间就都看完，最低要求是能做出来题目。


## 参考视频
注：后续会发只能油管看的视频或者只能在实验室NAS上看的视频，禁止传播。

### 视频 1

4.3节 IP Internet Protool

原视频链接：
[https://www.bilibili.com/video/BV1JV411t7ow/?p=32](https://www.bilibili.com/video/BV1JV411t7ow/?p=32)

<div style="position: relative; width: 100%; padding-top: 56.25%; margin: 1.5rem 0;">
  <iframe
    src="https://player.bilibili.com/player.html?bvid=BV1JV411t7ow&page=32&high_quality=1&danmaku=0&autoplay=0"
    loading="lazy"
    scrolling="no"
    border="0"
    frameborder="no"
    framespacing="0"
    allowfullscreen="true"
    style="position: absolute; inset: 0; width: 100%; height: 100%; border: 0; border-radius: 0.75rem;"
  ></iframe>
</div>

Linux网络配置（Centos为例），其他发行版的Linux大同小异，会理论就都能调明白。

### 视频 2

原视频链接：
[https://www.bilibili.com/video/BV17o4BeYEeq/](https://www.bilibili.com/video/BV17o4BeYEeq/)

<div style="position: relative; width: 100%; padding-top: 56.25%; margin: 1.5rem 0;">
  <iframe
    src="https://player.bilibili.com/player.html?bvid=BV17o4BeYEeq&page=1&high_quality=1&danmaku=0&autoplay=0"
    loading="lazy"
    scrolling="no"
    border="0"
    frameborder="no"
    framespacing="0"
    allowfullscreen="true"
    style="position: absolute; inset: 0; width: 100%; height: 100%; border: 0; border-radius: 0.75rem;"
  ></iframe>
</div>


## 练习题

实践题（标注命令和对应输出结果）：
1. 测试当前主机与百度(baidu.com)服务器的连通性。
2. 找出当前校园网内的IP地址和MAC地址。


简答题
1. 192.168.1.0/24能看出来子网掩码吗？
2. 192.168.1.0/24和192.168.2.0/24是同一子网吗？
3. 河海大学校园网的子网掩码是多少？既然是255.255.255.0，那为什么10.200.212.245可以和10.200.98.10这种不在同一网段的IP可以互访？

思考题（附分析过程和思路）
1. ping不通某个IP则证明主机一定不在线吗？
2. 河海大学的校园网IP遵循DHCP协议进行分配，那为什么有的服务器可以拥有固定IP呢？换言之，如果你把你的网卡的MAC地址改为服务器的MAC地址，在MAC地址不冲突且服务器离线的情况下，一定会按照预期，分配到服务器的固定IP吗？
3. 在校园网内，我们拥有公网IP吗？



## 评论区作答模板

建议大家复制下面的 Markdown 模板，到评论区直接填写自己的命令、结果和判断依据：

```md
## 实践题

1. 测试当前主机与百度（`baidu.com`）服务器的连通性
   - 命令：
   - 输出解读：

2. 找出当前校园网内的 IP 地址和 MAC 地址
   - 命令：
   - 输出解读：

## 简答题

1. `192.168.1.0/24` 能看出来子网掩码吗
   - 回答：

2. `192.168.1.0/24` 和 `192.168.2.0/24` 是同一子网吗
   - 回答：

3. 河海大学校园网的子网掩码是多少？既然是 `255.255.255.0`，那为什么 `10.200.212.245` 可以和 `10.200.98.10` 这种不在同一网段的 IP 可以互访
   - 回答：

## 思考题

1. `ping` 不通某个 IP，则证明主机一定不在线吗
   - 回答：

2. 河海大学的校园网 IP 遵循 DHCP 协议进行分配，那为什么有的服务器可以拥有固定 IP 呢？换言之，如果你把你的网卡的 MAC 地址改为服务器的 MAC 地址，在 MAC 地址不冲突且服务器离线的情况下，一定会按照预期分配到服务器的固定 IP 吗
   - 回答：

3. 在校园网内，我们拥有公网 IP 吗
   - 回答：
```
