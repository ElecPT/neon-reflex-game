# 霓虹反应 · 30 秒反应挑战

一个九宫格反应小游戏，支持鼠标、触屏和数字键 1–9，包含计时、连击、暂停、音效和本机最高分记录。

## 本地运行

需要 Node.js 22.13 或以上版本。

```sh
npm ci
npm run dev -- --port 3102
```

打开 http://localhost:3102 。

```sh
npm run build
```

使用 React、TypeScript、Vite / Vinext。启动命令兼容 Windows。保留原 Sites / Cloudflare 部署配置；云端部署需自行配置，上传 GitHub 不会自动上线网站。

游戏入口为 `app/page.tsx`。不包含依赖目录、构建缓存或环境密钥。