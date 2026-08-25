# 滑动变祖器

部署在 Vercel 的 31 档 TIBO 头像滑杆。评级由 GitHub Actions 每小时从公开的 codex-reset.com 社区信号源计算，并把最新快照和 Tibo 最近的 3 条动态写入 `public/data/tibo-score.json`；网站直接从该 GitHub 文件读取数据。

## 数据流

```text
GitHub Actions（每小时第 10 分钟）
  → codex-reset.com/api/feed：Tibo 公开 reset 信号与事件
  → 提交 public/data/tibo-score.json 与 public/data/tibo-timeline.json
  → Vercel 页面直接读取 raw GitHub JSON
```

最终档位为：

```text
round(30 × 信号强度)
```

- 活跃的全量 reset 为 `1.0`；已结束的 reset 和 banked reset 会在 24 小时、3 天、7 天后逐档衰减；候选、相关动态与平静状态依次降低。
- 该分数反映公开社区信号的强度，不是 X 评论区情感分析，也不是 OpenAI 的官方状态。
- 历史保留 90 天。滑杆的手动拖动只在当前浏览器预览，不会写回仓库；“自动变祖”会回到当前 reset 概率对应的档位。

## GitHub 设置

无需配置 X 或 OpenAI 密钥。确认仓库 **Settings → Actions → General → Workflow permissions** 允许工作流读写仓库内容；随后在 **Actions → Calculate TIBO score → Run workflow** 手动运行一次，之后会每小时自动运行。

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

Vercel 与 GitHub Actions 都不需要保存 X 或 OpenAI 密钥。社区数据源不可用或标记为 stale 时，工作流会失败而不会覆盖上一次有效快照。

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
| 30 | 圣TIBO | SAINT TIBO |

## 素材与许可

源代码以 [MIT](LICENSE) 协议发布。`media/source-frames` 与 `public/frames` 中的人像仅用于此趣味演示，不随 MIT 协议授权；再次发布前请确认获得本人及素材权利人的许可。
