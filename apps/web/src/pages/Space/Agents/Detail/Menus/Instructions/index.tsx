import { useState } from 'react';
import { Button } from '@brierb/brier-ui';
import { Input } from 'antd';

const INSTRUCTION_TEMPLATE = `# 角色定义
你是一个专业的 AI Agent，负责协助团队完成日常工作。

# 工作规范
- 遵循团队的编码规范和最佳实践
- 提交代码前进行自测和代码审查
- 使用清晰的 commit message
- 保持代码简洁，避免过度设计

# 协作要求
- 主动同步工作进展
- 遇到阻塞及时反馈
- 尊重他人的代码和文档`;

export const Instructions = () => {
  const [instructions, setInstructions] = useState('');

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-standard font-bold">指令</span>
          <Button size="small" onClick={() => setInstructions(INSTRUCTION_TEMPLATE)}>
            插入模版
          </Button>
        </div>
        <p className="mb-4 text-xs">为该 Agent 提供自定义指令和上下文</p>
        <Input.TextArea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={
            '默认使用中文回复\n回复保持简洁，结论优先\n修改代码后运行项目检查\n在已授权仓库内可以直接完成代码修改'
          }
          rows={12}
          className="resize-none"
        />
      </div>
    </div>
  );
};
