import { useState } from 'react';

interface VendorRule {
  match: (name: string) => boolean;
  vendor: string;
  slug: string;
  color: string;
}

const VENDOR_RULES: VendorRule[] = [
  {
    match: (name) => name.toLowerCase().includes('claude'),
    vendor: 'Anthropic',
    slug: 'anthropic',
    color: 'D97757',
  },
  {
    match: (name) => /codex|gpt/.test(name.toLowerCase()),
    vendor: 'OpenAI',
    slug: 'openai',
    color: '412991',
  },
  {
    match: (name) => name.toLowerCase().includes('gemini'),
    vendor: 'Google',
    slug: 'google',
    color: '4285F4',
  },
  {
    match: (name) => /deepseek|hermes/.test(name.toLowerCase()),
    vendor: 'DeepSeek',
    slug: 'deepseek',
    color: '4D6BFE',
  },
  {
    match: (name) => name.toLowerCase().includes('opencode'),
    vendor: 'OpenCode',
    slug: 'opencode',
    color: '18181B',
  },
  {
    match: (name) => name.toLowerCase().includes('opencat'),
    vendor: 'Opencat',
    slug: 'opencat',
    color: '18181B',
  },
];

export const getRuntimeVendor = (name: string): VendorRule | undefined =>
  VENDOR_RULES.find((rule) => rule.match(name));

export const RuntimeIcon = ({ name, size = 14 }: { name: string; size?: number }) => {
  const vendor = getRuntimeVendor(name);
  const [failed, setFailed] = useState(false);

  if (!vendor) return null;

  if (failed) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-[3px] text-[9px] font-bold text-white"
        style={{ width: size, height: size, background: `#${vendor.color}` }}
      >
        {vendor.vendor.charAt(0)}
      </span>
    );
  }

  return (
    <img
      src={`https://cdn.simpleicons.org/${vendor.slug}/${vendor.color}`}
      width={size}
      height={size}
      alt={vendor.vendor}
      className="shrink-0"
      style={{ borderRadius: 2 }}
      onError={() => setFailed(true)}
    />
  );
};

export const RuntimeBadge = ({ name, size = 14 }: { name: string; size?: number }) => (
  <span className="inline-flex items-center gap-1.5">
    <RuntimeIcon name={name} size={size} />
    <span>{name}</span>
  </span>
);
