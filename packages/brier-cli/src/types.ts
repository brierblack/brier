export type DaemonStatus = 'running' | 'stopped' | 'error';

export type TunnelState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export type StreamType = 'stdout' | 'stderr';

export type ClientMessage =
  | {
      type: 'auth';
      token: string;
      hostname: string;
      os: string;
      runtimes: string[];
      version?: string;
    }
  | { type: 'heartbeat'; timestamp: number }
  | { type: 'task-output'; taskId: string; stream: StreamType; data: string }
  | { type: 'task-complete'; taskId: string; exitCode: number }
  | { type: 'task-error'; taskId: string; error: string }
  | { type: 'runtime-info'; runtimes: string[] };

export type ServerMessage =
  | { type: 'auth-ok'; computerId: string }
  | { type: 'auth-failed'; reason: string }
  | { type: 'heartbeat-ack'; timestamp: number }
  | {
      type: 'task-start';
      taskId: string;
      runtime: string;
      command: string;
      args: string[];
      cwd?: string;
      env?: Record<string, string>;
    }
  | { type: 'task-cancel'; taskId: string }
  | { type: 'query-runtimes' };

export interface TaskInfo {
  taskId: string;
  runtime: string;
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface DaemonConfig {
  serverUrl: string;
  token: string;
  hostname: string;
  os: string;
  runtimes: string[];
  /** CLI 自身版本（package.json），Auth 时上报给服务端展示。 */
  version: string;
}

export interface PidFileData {
  pid: number;
  startTime: number;
  serverUrl: string;
}
