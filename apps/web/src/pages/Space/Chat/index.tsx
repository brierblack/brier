import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { AVAILABLE_AGENTS, InputBox } from './shared';

const SUGGESTIONS = [
  { icon: '📊', text: '帮我分析数据并生成可视化报告' },
  { icon: '🔍', text: '审查我的代码并提出改进建议' },
  { icon: '🧪', text: '为当前项目编写自动化测试用例' },
  { icon: '📄', text: '根据需求文档生成技术方案' },
];

const NewChat = () => {
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState(AVAILABLE_AGENTS[0]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    // 新会话发送后进入对应历史会话（此处模拟创建会话 id = Date.now()）
    navigate(`/space/chat/${Date.now()}`, { state: { firstMessage: text } });
  };

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <Logo className="h-10 w-10" variant="white" />
        <h1 className="text-xl font-bold">有什么可以帮你？</h1>
        <div className="w-full max-w-2xl">
          <InputBox
            agent={selectedAgent}
            value={input}
            onChange={setInput}
            onSend={handleSend}
            loading={false}
            onAgentSelect={setSelectedAgent}
          />
        </div>
        <div className="grid w-full max-w-2xl grid-cols-2 gap-2">
          {SUGGESTIONS.map((s, i) => (
            <div
              key={i}
              onClick={() => setInput(s.text)}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ghost bg-white p-3 transition-all hover:border-brand hover:bg-[#fff5ed]"
            >
              <span className="shrink-0 text-base">{s.icon}</span>
              <span className="text-standard">{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewChat;
