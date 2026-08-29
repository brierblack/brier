/**
 * Orval 自定义请求层（mutator）。
 * 统一处理：
 * - credentials: 'same-origin' —— 会话凭证走 HttpOnly Cookie，必须随请求携带
 * - 错误映射 —— 后端错误响应为 { error: string }，解析后抛出可读错误
 *
 * 签名约定（Orval）：返回 Promise<T>，T 为生成的响应联合类型
 * （如 logoutResponse = { data, status, headers } 判别联合）。
 */
export const customFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    credentials: 'same-origin',
  });

  if (!response.ok) {
    let message = `请求失败 (${response.status})`;
    try {
      const body = await response.json();
      if (body && typeof body.error === 'string') {
        message = body.error;
      }
    } catch {
      // 非 JSON 错误体，保留默认消息
    }
    throw new Error(message);
  }

  const body = [204, 205, 304].includes(response.status) ? null : await response.text();
  const data = body ? JSON.parse(body) : {};
  return { data, status: response.status, headers: response.headers } as T;
};
