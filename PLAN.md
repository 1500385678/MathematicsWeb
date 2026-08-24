# PLAN · MathematicsWeb

> 任务队列 + 路线图。agent 每天醒后先读这个,挑 ready 的最高优先级任务做。
> 人工也可加任务(直接编辑 + commit)。状态: `[ ]` 待办 / `[~]` 进行中 / `[x]` 完成 / `[!]` 阻塞。

---

## 路线图

- [x] Phase 0 · 资产盘点(2026-08-21)
- [x] Phase 1 · MVP(2026-08-21)
- [/] Phase 2 · 完整功能 — **当前阶段**
- [ ] Phase 3 · AI 智能化
- [ ] Phase 4 · 多端 + 商业化

---

## 任务队列

### P0 · 阻塞/紧急

- [~] **MATH-001** · 推送 v0.6.4 commit `ec6b4b2` 到 GitHub + Gitee
  - 描述: 5 分钟重试 cron 已挂,网络恢复后自动推。手动推也行。
  - 验收: 远程 main HEAD = `ec6b4b2`
  - 创建: 2026-08-24
  - 依赖: 网络通
  - 发现者: bootstrap

- [~] **MATH-002** · 清理 untracked 文件,决定归宿
  - 描述: `_test/` 5 个脚本 + `tools/` 目录 + `docs/knowledge_graph.json` + 2 个中文 .md 规划文件,未提交
  - 验收: 要么全部 commit,要么加入 .gitignore,要么说明留 untracked 的理由
  - 创建: 2026-08-24
  - 依赖: 无
  - 发现者: bootstrap

### P1 · 重要

- [ ] **MATH-003** · 19 个场景补 `getLesson()` 教学要点
  - 描述: v0.6.4 已示范 1 个(simple-harmonic),剩 19 个。教学要点喂给 LLM,提升 AI 助手质量
  - 验收: 每个 scene 文件导出 `getLesson()`,`_buildSceneContext` 拼进 prompt
  - 创建: 2026-08-24
  - 依赖: v0.6.4 getLesson 框架(已落地)
  - 优先级子项(教学价值排序):
    - 04_population-dynamics · Lotka-Volterra 双物种
    - 11_lissajous · 频率比 + 相位
    - 18_lagrange · 切点几何
    - 20_neural-net · 决策边界演化
    - 其他 15 个按用户反馈优先级

- [ ] **MATH-004** · 确认 3D 场景在低 WebGL 环境的友好降级
  - 描述: CHANGELOG v0.1.0 已知问题 #1。是否要加 feature detection + 2D fallback?
  - 验收: 无 GPU / 旧 WebGL 时显示"请用现代浏览器"提示,而非 silent 报错
  - 创建: 2026-08-24
  - 依赖: 无

### P2 · 优化

- [ ] **MATH-005** · 整理 `_test/` 散落文件
  - 描述: `_test/_cdp_test.js` `_test/_shot.js` `_test/_test_all.ps1` `_test/_test_one.ps1` 在 _test 下,工具类应该归 tools/ 或类似
  - 验收: 单一来源,命名一致
  - 创建: 2026-08-24
  - 依赖: MATH-002

- [ ] **MATH-006** · 优化首屏加载
  - 描述: 1000 颗星空 + three.js 1.2MB + 20 场景,首次加载可能慢。考虑分场景懒加载
  - 验收: 首屏 < 2s (本地 8765)
  - 创建: 2026-08-24
  - 依赖: 无

- [ ] **MATH-007** · 移动端 scene 卡片可读性
  - 描述: 教学卡片文字在手机屏可能溢出,需要响应式
  - 验收: 375px 宽屏下文字不溢出、控件可点
  - 创建: 2026-08-24
  - 依赖: 无

### 用户反馈

> 等用户首次发反馈后由 01_Owner 写入这里,P0 优先级。

---

## 关键决策记录(append-only,只追加不删)

- 2026-08-24: 零构建范式确认(不引 npm/webpack/vite)
- 2026-08-24: three.js 走 vendor/(避免 CDN 依赖)
- 2026-08-24: LLM 默认 mock 兜底,真 key 才接 M3
- 2026-08-24: v0.6.4 起 AI 上下文接 getLesson 教学要点通道
- 2026-08-24: 任务系统启用 PLAN.md 单一事实源

---

## 元数据

- **最后更新**: 2026-08-24
- **更新者**: 张勇(初始化) + math-advisor(后续自动)
- **配套 cron**: math-advisor-daily-wake (每天 9:00)
- **配套反馈收件箱**: `D:\Mac\Mac\Mac\Consultant\.Shared\feedback_inbox.json`
