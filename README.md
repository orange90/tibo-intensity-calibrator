# TIBO 评级滑动变阻器

一个 31 档的 TIBO 头像滑杆：从「牢TIBO / TIBO: CONTAINED」逐步过渡到「金TIBO · SAINT TIBO」。拖动滑杆只会在当前浏览器本地预览；每日自动评级由 Tibo 在 X 的公开评论情绪和明确的 Codex reset 信号共同决定。

## 评级规则

每日 UTC 00:10，Cloudflare Worker 分析前一天的数据并保存一份快照：

```
最终档位 = round(30 × (0.5 × 评论情绪 + 0.5 × reset 信号))
```

- 评论情绪：通过 X API 拉取 `@thsottiaux` 当日原创推文及同一 conversation 下的公开回复；OpenAI 以 0–1 逐条评分，取平均。无评论时为中性 `0.5`。
- reset 信号：OpenAI 只在推文明确确认 Codex 配额/使用额度已经或将要 reset 时给 `1`，否则为 `0`。
- 评分、推文与评论数量以及最近 90 天快照保存在 Cloudflare KV，项目不再使用 Cloudflare D1，也没有社区投票接口。

## 六个锚点

| 档位 | 中文昵称 | 英文状态名 |
| --- | --- | --- |
| 0 | 牢TIBO | TIBO: CONTAINED |
| 6 | 小TIBO | TIBO: STANDBY |
| 12 | 笑TIBO | TIBO: ONLINE |
| 18 | 硬TIBO | TIBO: IN COMMAND |
| 24 | 神TIBO | TIBO: ASCENDANT |
| 30 | 金TIBO | SAINT TIBO |

## 本地运行

```bash
npm install
npm run dev
```

单独启动 API：

```bash
npx wrangler kv namespace create TIBO_SCORE
# 用输出的 id 替换 wrangler.json 内 kv_namespaces[0].id
npx wrangler secret put X_BEARER_TOKEN
npx wrangler secret put OPENAI_API_KEY
# 可选，默认为 gpt-5-mini
npx wrangler secret put OPENAI_SENTIMENT_MODEL
npm run dev:worker
```

前端部署时设置 `VITE_API_BASE_URL=https://<你的-worker>.<你的子域>.workers.dev`。如果把 GitHub Pages 部署在非 `orange90.github.io` 域名，请同步更新 `wrangler.json` 的 `ALLOWED_ORIGINS`。

## 部署前检查

```bash
npm test
npm run build
npm run build:pages
```

`wrangler.json` 中的全零 KV id 是一个明确的部署占位符，必须替换成实际 KV namespace id 后才能部署 Worker。不要把 X 或 OpenAI 密钥提交到仓库。

## 素材与许可

源代码以 [MIT](LICENSE) 协议发布。`media/source-frames` 与 `public/frames` 中的人像仅用于此趣味演示，不随 MIT 协议授权；再次发布前请确认获得本人及素材权利人的许可。
