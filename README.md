# TIBO 评级滑动变阻器

部署在 Vercel 的 31 档 TIBO 头像滑杆。每日评级由 GitHub Actions 在仓库内计算，并把最新快照写入 `public/data/tibo-score.json`；网站直接从该 GitHub 文件读取数据，不需要 Cloudflare Worker、D1 或数据库。

## 数据流

```text
GitHub Actions（每日 UTC 00:10）
  → X API：Tibo 当日原创推文与评论
  → OpenAI：评论情绪 + Codex reset 信号
  → 提交 public/data/tibo-score.json 与 public/data/tibo-timeline.json
  → Vercel 页面直接读取 raw GitHub JSON
```

最终档位为：

```text
round(30 × (0.5 × 评论情绪 + 0.5 × reset 信号))
```

- 评论情绪为 0–1 的逐条评分平均值；无评论时为中性 `0.5`。
- reset 信号只在推文明确确认 Codex 配额/额度 reset 时为 `1`，否则为 `0`。
- 历史保留 90 天。滑杆的手动拖动只在当前浏览器预览，不会写回仓库。

## GitHub 设置

在仓库 **Settings → Secrets and variables → Actions** 中添加：

| 类型 | 名称 | 用途 |
| --- | --- | --- |
| Secret | `X_BEARER_TOKEN` | 调用 X API |
| Secret | `OPENAI_API_KEY` | 调用 OpenAI Responses API |
| Variable（可选） | `OPENAI_SENTIMENT_MODEL` | 默认 `gpt-5-mini` |

同时确认 **Settings → Actions → General → Workflow permissions** 允许工作流读写仓库内容。随后在 **Actions → Calculate TIBO score → Run workflow** 手动运行一次；之后会每天自动运行。

数据文件位置：

- 最新评分：`public/data/tibo-score.json`
- 90 天历史：`public/data/tibo-timeline.json`

## Vercel 部署

在 Vercel 中导入此 GitHub 仓库，Framework Preset 选择 **Vite**，构建命令为 `npm run build`，输出目录为 `dist`（这些已在 `vercel.json` 中声明）。

默认数据源是当前仓库的 raw GitHub 地址。若未来迁移仓库或想改用自己的数据镜像，在 Vercel 的 Environment Variables 中设置：

| 名称 | 作用 |
| --- | --- |
| `VITE_SCORE_URL` | 最新评分 JSON 的 HTTPS 地址 |
| `VITE_TIMELINE_URL` | 历史 JSON 的 HTTPS 地址 |

Vercel 不需要保存 X 或 OpenAI 密钥；这些密钥只存在 GitHub Actions 的 Secrets 中。

默认 raw GitHub 数据源要求仓库保持公开。若仓库设为私有，请为两个 `VITE_*_URL` 提供浏览器可读取的公开 HTTPS 数据地址。

## 本地运行

```bash
npm install
npm run dev
npm test
npm run build
```

## 六个锚点

| 档位 | 中文昵称 | 英文状态名 |
| --- | --- | --- |
| 0 | 牢TIBO | TIBO: CONTAINED |
| 6 | 小TIBO | TIBO: STANDBY |
| 12 | 笑TIBO | TIBO: ONLINE |
| 18 | 硬TIBO | TIBO: IN COMMAND |
| 24 | 神TIBO | TIBO: ASCENDANT |
| 30 | 金TIBO | SAINT TIBO |

## 素材与许可

源代码以 [MIT](LICENSE) 协议发布。`media/source-frames` 与 `public/frames` 中的人像仅用于此趣味演示，不随 MIT 协议授权；再次发布前请确认获得本人及素材权利人的许可。
