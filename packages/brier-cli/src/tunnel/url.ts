/**
 * 隧道接入端点工具：把服务端 http(s) 地址转换为 WebSocket 隧道地址。
 * 纯字符串转换（wss/ws://host/tunnel），无状态、无副作用。
 */
export const toWsUrl = (serverUrl: string): string => {
  return (
    serverUrl
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://')
      .replace(/\/$/, '') + '/tunnel'
  );
};
