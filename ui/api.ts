import type { Project, Run, Environment } from '../src/schema';
export const finished = (status: Run['status']) => !['queued', 'running'].includes(status);
let connection: { url: string; token: string } | undefined;
let initializing: Promise<void> | undefined;
async function initialize() {
  if (initializing) return initializing;
  initializing = (async () => {
    if ('__TAURI_INTERNALS__' in window) {
      const { invoke } = await import('@tauri-apps/api/core');
      for (let attempt = 0; attempt < 50; attempt++) {
        try {
          connection = await invoke('engine_connection');
          break;
        } catch (error) {
          if (attempt === 49) throw error;
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }
    } else {
      const fragment = new URLSearchParams(location.hash.slice(1));
      const token = fragment.get('token');
      if (token) {
        sessionStorage.setItem('rehearsal-token', token);
        history.replaceState(null, '', location.pathname);
      }
      const saved = token ?? sessionStorage.getItem('rehearsal-token');
      if (saved) connection = { url: location.origin, token: saved };
    }
  })().catch((error) => {
    initializing = undefined;
    throw error;
  });
  return initializing;
}
export async function api<T>(
  path: string,
  options?: { method?: string; body?: unknown },
): Promise<T> {
  const response = await raw(path, options);
  return response.json() as Promise<T>;
}
export async function raw(path: string, options?: { method?: string; body?: unknown }) {
  await initialize();
  const response = await fetch(`${connection?.url ?? ''}/api${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      ...(connection ? { Authorization: `Bearer ${connection.token}` } : {}),
      ...(options?.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: options?.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ error: `Engine returned ${response.status}` }));
    throw new Error(body.error ?? 'Request failed');
  }
  return response;
}
export async function download(path: string, name: string) {
  const response = await raw(path);
  if ('__TAURI_INTERNALS__' in window) {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('save_download', {
      suggestedName: name,
      bytes: Array.from(new Uint8Array(await response.arrayBuffer())),
    });
    return;
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const projectList = () => api<Project[]>('/projects');
export const runList = (id: string) => api<Run[]>(`/runs?project=${encodeURIComponent(id)}`);
export const environment = (id: string) =>
  api<Environment>(`/projects/${encodeURIComponent(id)}/environment`);
export const shortTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
export const duration = (ms?: number) =>
  ms === undefined ? 'In progress' : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
