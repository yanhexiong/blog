---
title: 2.基础Shell指令（2）
published: 2026-03-29
description: Linux 教程系列《基础Shell指令-2》
hideFromLists: true
tags: ["Linux", "教程", "Shell"]
category: 教程
draft: false
---

本节仍然围绕基础 Shell 指令展开，是第一节内容的延伸。重点会放在文本处理、输出重定向、多版本 CUDA Toolkit 管理，以及终端退出后的长任务运行方式上。

## 特别提醒

1. 评论区作答时，请尽可能把思路写完整；如果同一题有多种解法，可以合并展示并说明差异。

## 参考视频

第一节中的参考视频本节仍然适用，这里只额外补充一个较短的视频：

原视频链接：
[https://www.bilibili.com/video/BV1D44y1w7GX/](https://www.bilibili.com/video/BV1D44y1w7GX/)

<div style="position: relative; width: 100%; padding-top: 56.25%; margin: 1.5rem 0;">
  <iframe
    src="https://player.bilibili.com/player.html?bvid=BV1D44y1w7GX&page=1&high_quality=1&danmaku=0&autoplay=0"
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

### 实践题

请尽量让每一小题都给出可直接执行的命令或方案。若题目中提到“文本文件”，默认可假设当前目录存在文件 `test.txt`。

1. 在不使用 `conda` 的前提下，给出一种让多个 CUDA Toolkit 版本共存并完成切换的方案，并说明如何验证切换是否生效。
2. 在不使用 `vim`、`vi`、`nano` 等终端文本编辑器，也不使用 VS Code、FinalShell 等工具的文件管理功能的前提下，给出一种仅使用 Shell 命令向文件写入内容的方法。
3. 使用一条 Shell 命令，判断 `test.txt` 中是否存在字符串 `qcsgg`。
4. 使用一条 Shell 命令，统计 `test.txt` 中字符串 `qcsgg` 出现的次数。
5. 使用一条 Shell 命令，输出 `test.txt` 的最后 5 行内容。
6. 假设你要运行一个大约持续 10 小时的训练任务，启动命令为 `python train.py`。请给出一种在终端关闭或 SSH 连接断开后，训练仍能继续运行的方案。

### 思考题

1. Linux 中常见的标准流有哪些？它们各自的编号和用途分别是什么？
2. 重定向符号 `>`、`>>`、`2>`、`2>>`、`2>&1` 分别有什么作用？它们之间的区别是什么？
3. 只使用 Shell 命令向文件写入内容时，覆盖写入和追加写入分别适用于什么场景？
4.  如果训练任务已经启动，但你忘记提前使用 `nohup`、`screen` 或 `tmux`，后续补救通常会比一开始就正确启动更麻烦，为什么？
5.  Linux 中“分区”“文件系统”“挂载点”分别是什么？三者之间是什么关系？
6.  为什么在 Linux 中，新增一块磁盘或新建一个分区后，通常还不能直接使用，而是还要经过格式化和挂载这两个步骤？
7. /tmp 目录适合存放什么？为什么通常不建议把重要的长期数据放在 /tmp 中？

## 评论区作答模板

建议大家复制下面的 Markdown 模板，到评论区直接填写自己的答案和思路：

```md
## 实践题

1. 多版本 CUDA Toolkit 共存与切换方案
   - 方案：
   - 关键命令：
   - 如何验证切换生效：

2. 仅使用 Shell 向文件写入内容的方法
   - 方法：
   - 示例命令：
   - 覆盖写入还是追加写入：

3. 判断 `test.txt` 中是否存在 `qcsgg`
   - 命令：
   - 判断依据：

4. 统计 `test.txt` 中 `qcsgg` 出现次数
   - 命令：
   - 结果说明：

5. 输出 `test.txt` 最后 5 行
   - 命令：
   - 结果说明：

6. 终端关闭后继续运行 `python train.py`
   - 方案：
   - 启动命令：
   - 如何查看任务是否仍在运行：

## 思考题

1. 标准流的种类、编号与用途
   - 回答：

2. `>`、`>>`、`2>`、`2>>`、`2>&1` 的区别
   - 回答：

3. 覆盖写入与追加写入的适用场景
   - 回答：

4. 为什么长任务如果没有提前规划运行方式，后续补救会更麻烦
   - 回答：

5. 分区、文件系统、挂载点三者的关系
   - 回答：

6. 为什么新分区后通常还要格式化和挂载
   - 回答：

7. `/tmp` 目录的用途，以及为什么不适合长期存放重要数据
   - 回答：
```
