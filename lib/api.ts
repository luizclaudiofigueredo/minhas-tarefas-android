import Constants from 'expo-constants';

type RequestOptions = RequestInit & {
  token?: string | null;
};

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? extra?.apiBaseUrl ?? 'http://10.0.2.2:3000/api/v1';

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  if (__DEV__) {
    console.log('[apiRequest]', {
      path,
      hasToken: Boolean(token),
      tokenPreview: token ? `${token.slice(0, 16)}...` : null,
      tokenLength: token?.length ?? 0,
    });
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 204) {
    return null as T;
  }

  const raw = await response.text();
  const data: { error?: string } & Partial<T> = (() => {
    if (!raw) return {};

    try {
      return JSON.parse(raw) as { error?: string } & Partial<T>;
    } catch {
      return {};
    }
  })();

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(data.error ?? 'Sessao expirada ou token invalido. Entre novamente.');
    }

    if (response.status === 404) {
      throw new Error(data.error ?? 'Rota da API nao encontrada. Reinicie o backend para recarregar as rotas.');
    }

    throw new Error(data.error ?? `Falha na comunicacao com a API (HTTP ${response.status}).`);
  }

  return data as T;
}
