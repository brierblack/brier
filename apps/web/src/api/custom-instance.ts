/**
 * Orval 自定义请求层（mutator）。
 * 统一处理：
 * - credentials: 'same-origin' —— 会话凭证走 HttpOnly Cookie，必须随请求携带
 * - 错误映射 —— 后端错误响应为 { error: string }，解析后抛出可读错误
 *
 * 约定：本层只处理 2xx JSON 接口（登录/登出等 302 跳转接口不走 fetch，
 * 由 AuthContext 用整页跳转完成）。配合 `includeHttpResponseReturnType: false`，
 * 泛型 T 即接口的数据类型，调用方拿到的就是纯数据（User / Workspace[] / ...）。
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
  return body ? (JSON.parse(body) as T) : ({} as T);
};
