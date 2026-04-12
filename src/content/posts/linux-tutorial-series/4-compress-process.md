---
title: 4.压缩与进程管理
published: 2026-04-12
description: Linux 教程系列第四章，围绕常见压缩打包命令和基础进程管理进行。
hideFromLists: true
tags: ["Linux", "教程", "压缩", "进程"]
category: 教程
draft: false
---

考虑到四月底大家服务外包要结题了，然后马上又要进入期中阶段了，这几节的内容就少留一些。

本节的内容就两个：压缩和进程管理。

大家都在 Windows 上用过压缩软件，并且玩游戏的时候也经常会用任务管理器去杀掉未响应的进程。前面又说过 `tmux`、`nohup` 等工具的使用，基础知识大家已经了解得差不多了，这一节跟着下面两个视频看一下就可以了。

## 参考视频

### 视频 1

原视频链接：
[https://www.bilibili.com/video/BV184oqYuEsP/](https://www.bilibili.com/video/BV184oqYuEsP/)

<div style="position: relative; width: 100%; padding-top: 56.25%; margin: 1.5rem 0;">
  <iframe
    src="https://player.bilibili.com/player.html?bvid=BV184oqYuEsP&page=1&high_quality=1&danmaku=0&autoplay=0"
    loading="lazy"
    scrolling="no"
    border="0"
    frameborder="no"
    framespacing="0"
    allowfullscreen="true"
    style="position: absolute; inset: 0; width: 100%; height: 100%; border: 0; border-radius: 0.75rem;"
  ></iframe>
</div>

### 视频 2

原视频链接：
[https://www.bilibili.com/video/BV1qz421Z7Ug/](https://www.bilibili.com/video/BV1qz421Z7Ug/)

<div style="position: relative; width: 100%; padding-top: 56.25%; margin: 1.5rem 0;">
  <iframe
    src="https://player.bilibili.com/player.html?bvid=BV1qz421Z7Ug&page=1&high_quality=1&danmaku=0&autoplay=0"
    loading="lazy"
    scrolling="no"
    border="0"
    frameborder="no"
    framespacing="0"
    allowfullscreen="true"
    style="position: absolute; inset: 0; width: 100%; height: 100%; border: 0; border-radius: 0.75rem;"
  ></iframe>
</div>


## 特别提醒
1. 压缩与打包练习建议自己先在一个目录创建测试目录，例如里面放几个文本文件文件和一个子目录，再进行打包和解压操作。
2. 本章里的进程管理主要聚焦在“查看”和“基础控制”上，例如 `ps`、`top`、`jobs`、`bg`、`fg`、`kill`、`pkill`。练习时请只操作你自己启动的测试进程，不要随便结束实验室服务器上别人的任务（即使在Docker容器内（--privileged 选项开启的情况下）也容易误删其他容器的进程）。


## 练习题

### 实践题

请尽量让每一小题都给出可以直接执行的命令；如果某题更适合用两条命令配合完成，也请说明每条命令分别起什么作用。

1. 把当前目录下的 `demo/` 目录打包并压缩成 `demo.tar.gz`和 `demo.zip`。
2. 不解压 `demo.tar.gz` \ `demo.zip`，直接查看压缩包里包含哪些文件。
3. 把 `demo.tar.gz` \ `demo.zip` 解压到当前目录下的 `output/` 目录。
4. 启动一个持续 300 秒的进程，并在另一个终端中查看这个进程是否正在运行。
5. 结束一个你自己启动的测试进程，并验证它确实已经停止。

### 思考题

1. 为什么Linux中常见的是 `tar.gz` 这种压缩文件格式，而不是 `zip`/ `rar` / `7z`这种？
2. `tar.gz` 和 `zip` 在使用场景上通常有什么区别？
3. `ps`、`top`、`jobs` 三类命令分别是干什么的？
4. 在使用 `nvitop` 监控深度学习训练时，如果要终止某个训练任务，`nvitop` 会给出 `SIGINT`、`SIGTERM`、`SIGKILL` 这几个选项。它们分别代表什么样的终止方式？如果当前训练任务就在你自己的 shell 前台运行，分别可以怎样手动触发这几种终止方式？
## 评论区作答模板

建议大家复制下面的 Markdown 模板，到评论区直接填写自己的命令、结果和判断依据：

```md
## 实践题

1. 把 `demo/` 分别打包压缩成 `demo.tar.gz` 和 `demo.zip`
   - 命令：
   - 输出解读：

2. 不解压查看 `demo.tar.gz` 和 `demo.zip` 的内容
   - 命令：
   - 输出解读：

3. 解压 `demo.tar.gz` 和 `demo.zip` 到 `output/`
   - 命令：
   - 输出解读：

4. 启动一个持续 300 秒的测试进程，并查看是否运行
   - 启动命令：
   - 查看命令：
   - 判断结果：

5. 结束测试进程并验证它已经停止
   - 命令：
   - 验证方法：
   - 判断结果：

## 思考题

1. 为什么 Linux 中常见的是 `tar.gz`，而不是 `zip`、`rar`、`7z`
   - 回答：

2. `tar.gz` 与 `zip` 的常见使用场景区别
   - 回答：

3. `ps`、`top`、`jobs` 三类命令分别是干什么的
   - 回答：

4. 在使用 `nvitop` 监控深度学习训练时，`SIGINT`、`SIGTERM`、`SIGKILL` 分别代表什么终止方式？如果当前训练任务就在你自己的 shell 前台运行，分别可以怎样手动触发这几种终止方式？
   - 回答：
```
