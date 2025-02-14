# 宝林的个人博客

这是一个基于 Hugo 构建的个人博客项目，用于分享技术文章和个人见解。

## 项目结构

```
├── archetypes/    # 文章模板
├── content/       # 博客文章内容
├── static/        # 静态资源
├── themes/        # 主题文件
└── config.toml    # 配置文件
```

## 主题信息

本博客使用了以下主题：

- hugo-theme-stack


## 本地运行

1. 确保已安装 Hugo
```bash
brew install hugo  # macOS
```

2. 克隆项目
```bash
git clone <repository-url>
cd my-site
```

3. 启动本地服务器
```bash
hugo server -D
```

访问 http://localhost:1313 查看博客

## 创建新文章

```bash
hugo new post/article-name.md
```

## 构建部署

```bash
hugo -D  # 生成静态文件
```

构建后的文件将生成在 `public/` 目录下。

## 文章格式

每篇文章都需要包含以下前置参数：

```yaml
+++
date = '发布日期'
title = '文章标题'
+++
```

## License

MIT License