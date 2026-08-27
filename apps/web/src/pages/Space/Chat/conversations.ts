export interface ChatMessage {
  id: number;
  role: 'user' | 'agent';
  content: string;
  agentId?: number;
}

export interface Conversation {
  id: number;
  title: string;
  messages: ChatMessage[];
}

export const conversations: Conversation[] = [
  {
    id: 1,
    title: '优化数据库查询性能',
    messages: [
      {
        id: 101,
        role: 'user',
        content: '有个 SQL 查询要 3 秒才能跑完，帮忙看看怎么优化？',
      },
      {
        id: 102,
        role: 'agent',
        content:
          '建议先看执行计划。常见问题是 WHERE 条件里的函数导致索引失效，例如 DATE(create_time) = \'2026-08-01\'。建议改成范围查询 create_time >= ... AND create_time < ...，让索引生效。\n\n如果需要，我可以帮你重写这条 SQL。',
        agentId: 2,
      },
      {
        id: 103,
        role: 'user',
        content: '改成范围查询后确实快了很多，从 3 秒降到了 200ms，谢谢！',
      },
      {
        id: 104,
        role: 'agent',
        content: '不客气！另外建议给高频查询的联合索引补上覆盖列，可以进一步减少回表。',
        agentId: 2,
      },
    ],
  },
  {
    id: 2,
    title: '修复登录页 OAuth 回调',
    messages: [
      {
        id: 201,
        role: 'user',
        content: '登录页 OAuth 回调一直报 redirect_uri_mismatch，怎么排查？',
      },
      {
        id: 202,
        role: 'agent',
        content:
          'redirect_uri_mismatch 通常是 GitHub OAuth 应用里配置的回调地址与前端跳转地址不一致。请检查：\n1. GitHub 应用设置里的 Callback URL 是否与 .env 中的 REDIRECT_URI 一致\n2. 本地开发端口是否与配置匹配\n\n我在 auth.ts 里看到回调路径是 /api/auth/github/callback，确认下配置。',
        agentId: 2,
      },
      {
        id: 203,
        role: 'user',
        content: '找到了，是本地端口从 3000 换到 5173 后没更新配置，已修复。',
      },
    ],
  },
  {
    id: 3,
    title: '重构 API 服务层架构',
    messages: [
      {
        id: 301,
        role: 'user',
        content: '想把 API 服务层按领域模块拆分，有什么建议？',
      },
      {
        id: 302,
        role: 'agent',
        content:
          '建议按领域拆分为 auth、workspace、agent、automation 四组模块，每组包含 controller、service、repository 三层。\n\n关键点：\n- 模块间通过接口通信，不直接引用实现\n- 统一错误处理（你们已有 virs-error）\n- 每个模块独立 DTO，避免跨模块字段耦合',
        agentId: 1,
      },
    ],
  },
  {
    id: 4,
    title: '编写单元测试覆盖率报告',
    messages: [
      {
        id: 401,
        role: 'user',
        content: '帮我生成核心模块的测试覆盖率报告',
      },
      {
        id: 402,
        role: 'agent',
        content:
          '已统计 6 个核心模块：\n- auth: 82%\n- workspace: 76%\n- agent: 71%\n- automation: 64%\n\n平均覆盖率 74%，automation 模块缺口最大，需要补充触发条件与动作执行的测试用例。',
        agentId: 2,
      },
    ],
  },
  {
    id: 5,
    title: '部署 v2.3 到预发环境',
    messages: [
      {
        id: 501,
        role: 'user',
        content: 'v2.3 分支可以部署到预发环境了吗？',
      },
      {
        id: 502,
        role: 'agent',
        content:
          '检查结果：\n- CI 流水线全部通过 ✓\n- 数据库迁移脚本已执行 ✓\n- 依赖版本无冲突 ✓\n\n可以部署。建议部署后跑一遍冒烟用例：登录、建会话、发起对话。',
        agentId: 4,
      },
    ],
  },
  {
    id: 6,
    title: '分析用户留存数据',
    messages: [
      {
        id: 601,
        role: 'user',
        content: '最近一个月用户留存为什么下降？',
      },
      {
        id: 602,
        role: 'agent',
        content:
          '分析发现新用户 7 日留存从 32% 降到 27%，主要拐点在 8 月中旬。\n\n可能原因：\n1. 新用户引导页改版后完成率下降\n2. 自动化功能入口太深，新用户找不到\n\n建议先恢复引导页旧版做 A/B 测试。',
        agentId: 1,
      },
    ],
  },
  {
    id: 7,
    title: '设计 Agent 协作流程图',
    messages: [
      {
        id: 701,
        role: 'user',
        content: '帮我设计一个多 Agent 协作的流程图',
      },
      {
        id: 702,
        role: 'agent',
        content:
          '建议采用「总参谋部」协调模式：\n\n总参谋部 Agent（协调者）→ 拆解任务 → 分发到各专业 Agent → 汇总结果\n\n流程：\n1. 总参谋部接收需求\n2. 情报侦察连收集上下文\n3. 工程突击营编码实现\n4. 纪律监察团代码审查\n5. 总参谋部汇总交付',
        agentId: 4,
      },
    ],
  },
  {
    id: 8,
    title: '排查生产环境内存泄漏',
    messages: [
      {
        id: 801,
        role: 'user',
        content: '生产环境内存持续增长，帮忙排查',
      },
      {
        id: 802,
        role: 'agent',
        content:
          '从监控看，内存从上周开始线性增长，疑似泄漏。建议：\n\n1. 先抓一次堆转储（jmap -dump）分析对象分布\n2. 重点检查是否有全局缓存未清理\n3. 查看 GC 日志确认是否老年代持续增长\n\n把堆转储文件发我，可以帮你做对象引用分析。',
        agentId: 2,
      },
    ],
  },
  {
    id: 9,
    title: '升级 React 到 v19',
    messages: [
      {
        id: 901,
        role: 'user',
        content: 'React 19 升级有哪些注意点？',
      },
      {
        id: 902,
        role: 'agent',
        content:
          'React 19 主要注意：\n1. 移除对 defaultProps 的警告，改用参数默认值\n2. Suspense 增强，支持 use() 读取 Promise\n3. ref 可作为 prop 直接传递\n4. 编译器自动 memo 化，可移除大部分 useMemo\n\n项目当前用 React 19，迁移成本不大。',
        agentId: 2,
      },
    ],
  },
  {
    id: 10,
    title: '设计权限模型重构方案',
    messages: [
      {
        id: 1001,
        role: 'user',
        content: '现在的权限模型太乱了，帮忙设计重构方案',
      },
      {
        id: 1002,
        role: 'agent',
        content:
          '建议采用 RBAC + 空间维度模型：\n\n- 角色：Owner / Admin / Member / Guest\n- 资源：空间、Agent、团队、自动化\n- 权限点：查看、编辑、执行、删除\n\n核心表：users、roles、permissions、user_roles、role_permissions，再加空间隔离字段。',
        agentId: 1,
      },
    ],
  },
  {
    id: 11,
    title: '优化 Docker 构建缓存',
    messages: [
      {
        id: 1101,
        role: 'user',
        content: 'Docker 构建太慢了，怎么用缓存优化？',
      },
      {
        id: 1102,
        role: 'agent',
        content:
          '核心思路是把依赖安装层前置，利用 layer 缓存：\n\n1. 先 COPY package.json / Cargo.toml，再 RUN install\n2. 使用 pnpm fetch 分离依赖下载\n3. 构建阶段分多阶段，最终镜像只保留产物\n\n预计构建时间可从 6 分钟降到 2 分钟内。',
        agentId: 2,
      },
    ],
  },
  {
    id: 12,
    title: '编写 API 文档自动生成',
    messages: [
      {
        id: 1201,
        role: 'user',
        content: '怎么给项目加 API 文档自动生成？',
      },
      {
        id: 1202,
        role: 'agent',
        content:
          '推荐方案：\n\n1. Rust 侧用 utoipa 从代码注释生成 OpenAPI 3.0 规范\n2. 前端用 openapi-typescript 生成类型\n3. 配合 redoc 渲染在线文档\n\n接入后每次构建自动同步文档，避免手写文档过期问题。',
        agentId: 2,
      },
    ],
  },
];

export const recentConversations: Conversation[] = conversations.slice(0, 7);
export const olderConversations: Conversation[] = conversations.slice(7);

export function getConversationById(id: number): Conversation | undefined {
  return conversations.find((c) => c.id === id);
}
