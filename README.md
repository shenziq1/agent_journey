# Agent Journey v0.1

记录真实成长、学习与业务成果的个人静态网站。无运行时依赖、账号、数据库或后台，使用 Node.js 内置模块生成 HTML 和 CSS；部署产物无需 Node.js。

## 本地运行

需要 Node.js 22 或更高版本，无需安装 npm 依赖。

```sh
cd /workspace/agent_journey
npm start
```

在本机浏览器打开 `http://localhost:3000`，按 Ctrl+C 停止。只监听本机回环地址，不公开服务。可以用 `PORT=3100 npm start` 更换端口。

`npm start` 启动前自动构建。修改数据或样式后，停止并重新运行即可刷新产物，不含热更新。

```sh
npm run validate  # 验证数据
npm test          # 自动化测试
npm run build    # 构建到 dist/
npm run check    # 全部验证、测试与构建
```

## 内容与事实边界

初始公开记录只有 2026-10-26 的写作与规划成果，验证依据为作者确认，未公开私人文章或附件。learnAgent、mealAgent 均尚未开始，无完成记录、无已验证技能。首页下一步是建议的待办动作，不是已完成成果。没有调整两个项目的学习计划或架构。

网站提供项目状态、最近成果、下一步、按日期倒序的成果时间线、可展开的验证与证据，以及关联成果的能力列表。支持移动布局、键盘导航、减少动态效果设置，页面无需 JavaScript。

## 新增真实进度

修改 `data/journey.json` 即可更新内容，无需修改 HTML。不要公开私人文章、情感经历、医疗信息、密钥或未获授权的证据。

1. 实际完成任务并验证结果后，在 `records` 数组加入一条记录。
2. 更新 `updatedAt` 为本次内容更新日期。记录日期不能晚于此日期。
3. 若成果属于某个项目，填写其 `projectId`，并将该项目状态从 `not-started` 更新为 `in-progress` 等真实状态。
4. 更新项目的 `nextAction`，运行 `npm run check`，再启动预览。

记录格式示例（仅示例，不代表已完成，请用真实内容替换后添加）：

```json
{
  "id": "unique-result-id",
  "date": "2026-10-26",
  "projectId": "learnAgent",
  "kind": "learning",
  "title": "真实完成的任务标题",
  "summary": "完成了什么，以及实际观察到的结果。",
  "verification": {
    "method": "可复现测试 / 人工检查 / 作者确认",
    "result": "具体命令、通过数量或人工核对结果；明确未运行或失败的检查。"
  },
  "evidence": [
    { "label": "实际 commit 或测试报告", "url": "https://github.com/OWNER/REPO/commit/REAL_SHA" }
  ]
}
```

`projectId` 为项目 id，独立成果用 `null`。`kind` 可选 `writing-planning`、`learning`、`coding`、`business`；不要把写作当作编码。`evidence` 可以是空数组，但验证方式和结果必填。证据链接只允许不含凭据的 HTTPS。自动校验能检查结构，不能证明内容真实；发布前须人工核实。

项目状态可选 `not-started`、`in-progress`、`paused`、`completed`。休息不会清空记录；完成数量由关联记录计算，没有经验值或等级。

能力确实经过实践验证后，向 `skills` 添加：

```json
{
  "id": "unique-skill-id",
  "name": "经过验证的能力名称",
  "description": "能力范围及已验证的边界",
  "recordIds": ["已存在的真实成果id"]
}
```

能力必须关联至少一条存在的验证记录。记录和技能 id 均须唯一。添加成果后无需修改测试中的初始记录数量。

## 文件结构

- `data/journey.json`：公开进度内容，随 Git 审核。
- `src/`：页面模板与响应式样式。
- `scripts/`：数据验证、静态构建、本地服务。
- `test/`：无效数据拒绝与构建回归测试。
- `.github/workflows/ci.yml`：push/PR 自动检查并上传静态产物。
- `dist/`：可重新生成的产物，已加入 Git 忽略。

## 下一阶段：GitHub Actions 部署到 RackNerd VPS

本版只包含 CI，不包含自动部署任务，没有连接 VPS。当前工作流在 push/PR 上使用 Node.js 22 执行 `npm run check`，通过后上传 `agent-journey-dist` artifact。

以后部署可沿用以下流程，无需改变应用架构：

1. 确认 VPS 的 SSH 端口、域名、站点目录与 Web 服务，单独授权服务器初始化。创建专用低权限部署用户，只允许写入站点发布目录。
2. 在 GitHub Environment `production` 配置审批与分支限制。安全保存 `VPS_HOST`、`VPS_USER`、`VPS_PORT`、`VPS_SSH_KEY` 及已通过可信渠道核实的 `VPS_KNOWN_HOSTS`。不要关闭 SSH 主机验证，也不要把私钥提交进仓库。
3. 新增独立部署工作流：仅 main 推送或手动触发；先执行检查、构建，再通过 SSH/SCP 上传 `dist/` 到独立版本目录。PR 不获得部署密钥。
4. 检查上传内容后原子切换站点 `current` 符号链接，由 Nginx/Caddy 提供静态文件。部署作业设置 concurrency，避免并发切换。
5. 对公开站点执行 HTTP 健康检查，检查页面及 CSS；失败时切回上一版本目录。保留少量历史版本便于回滚。

部署只传 `dist/`，不上传 `.git`、源数据之外的私人文件或密钥。域名、TLS、用户创建和 Web 服务配置属于后续获授权的服务器工作，本阶段不执行。

## 无需 VPS：发布到 GitHub Pages

仓库已提供发布工作流 `.github/workflows/pages.yml`：推送到 main 后自动验证、构建并部署，也支持手动触发。

1. 在 GitHub 仓库的 Settings → Pages → Build and deployment，将 Source 设置为 GitHub Actions。免费 GitHub 账户通常需要公开仓库；私有仓库的 Pages 可用性取决于套餐。发布前检查仓库及网站内容是否适合公开。
2. 在 Actions 页面选择 Publish to GitHub Pages → Run workflow，选择 main 并运行。
3. 工作流会验证数据、运行测试并构建，然后将 dist/ 发布至 Pages。成功后在部署作业或 Settings → Pages 查看实际网址。默认项目网址为 https://shenziq1.github.io/agent_journey/ 。
4. 后续修改数据并推送到 main 后，工作流会自动更新网站。无需服务器、SSH 密钥或额外 npm 依赖。

这是可选的公开托管方式，不会连接 RackNerd VPS；VPS 部署方案仍见上一节。

## 修改前言

`data/preface.json` 独立保存前言标题、副标题、整理说明和正文段落。当前为随笔与后记的公开整理节选，非原文全文；没有纳入私人生活与情感细节。修改后运行 `npm run check` 并重启本地服务。原始私人 DOCX 不应提交到公开仓库，也不应包含在 `dist/` 中。前言是文章内容，不会增加项目完成数量或已验证能力。

## 管理员模式

首页右上角点击“管理员模式”，在弹窗输入密码后，前言会原位替换为完整随笔及后记，其他项目区域保留。空格按原样参与密码，不做 trim。按钮变为“退出”，点击清除解锁内容并刷新页面，恢复公开前言。刷新或离开页面后也不保留解锁状态。取消弹窗不会进入管理员模式。不会将密码或原文保存至 localStorage、Cookie 或服务器。原独立原文页已移除。此模式是本机浏览器的阅读切换，不提供写入日记或后台管理权限。

GitHub Pages 没有后端账号认证。此功能使用 Web Crypto 的 PBKDF2-SHA256（600000 次）与 AES-256-GCM，公开仓库和部署产物仅包含 `data/original.encrypted.json` 密文，不包含原始 DOCX、明文或密码。密文可被下载并离线猜测，短密码和空白密码很容易被破解；此功能不适合以弱密码保护敏感资料。修改密码无法撤回已经下载的历史密文或明文。浏览器需要 HTTPS 或 localhost。

构建过程仅复制现有密文，不需要密码或私人文件。更新原文或密码时，在可信本地环境中提取 DOCX 的正文段落为 JSON 数组，使用 `src/article-crypto.mjs` 导出的 `encryptArticle(plaintext, password)` 重新生成密文；不要把密码放入命令行参数、源代码或提交历史。先核对解密结果与源文完全一致，再只提交新密文，并运行 `npm run check`。原始文档始终保留在仓库外。
