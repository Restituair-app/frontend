import { appParams } from '@/lib/app-params';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const ACCESS_TOKEN_KEY = 'base44_access_token';
const REFRESH_TOKEN_KEY = 'base44_refresh_token';
const NOTA_FISCAL_PAYLOAD_KEYS = [
  'estabelecimento',
  'cnpj',
  'valor_total',
  'data_emissao',
  'categoria',
  'imagem_url',
  'numero_nota',
  'itens',
  'observacoes',
];

let accessToken = appParams.token || localStorage.getItem(ACCESS_TOKEN_KEY) || null;
let refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || null;

const safeParse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

const setTokens = (tokens = {}) => {
  accessToken = tokens.accessToken || null;
  refreshToken = tokens.refreshToken || null;

  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

const clearTokens = () => {
  setTokens({ accessToken: null, refreshToken: null });
};

const normalizeNotaFiscalPayload = (payload = {}) => {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const normalized = {};

  NOTA_FISCAL_PAYLOAD_KEYS.forEach((key) => {
    const value = payload[key];

    if (value === undefined) {
      return;
    }

    if (key === 'valor_total' && typeof value === 'number' && !Number.isFinite(value)) {
      return;
    }

    normalized[key] = value;
  });

  return normalized;
};

const toAuthError = (status, data) => {
  const message =
    (typeof data === 'object' && data && 'message' in data && String(data.message)) ||
    `Request failed with status ${status}`;
  const error = new Error(message);
  error.status = status;
  error.data = data;
  return error;
};

const resolveApiBaseUrl = () => {
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    return API_BASE_URL;
  }

  const normalizedPath = API_BASE_URL.startsWith('/') ? API_BASE_URL : `/${API_BASE_URL}`;
  return `${window.location.origin}${normalizedPath}`;
};

const tryRefreshToken = async () => {
  if (!refreshToken) {
    return false;
  }

  const response = await fetch(`${resolveApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  const data = await safeParse(response);

  if (!response.ok) {
    clearTokens();
    return false;
  }

  if (data?.tokens) {
    setTokens(data.tokens);
  }

  return Boolean(data?.tokens?.accessToken);
};

const request = async (path, options = {}) => {
  const {
    method = 'GET',
    body,
    query,
    auth = true,
    retryOnAuthFailure = true,
    headers = {},
  } = options;

  const url = new URL(`${resolveApiBaseUrl()}${path}`);

  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  const requestHeaders = { ...headers };
  const isFormData = body instanceof FormData;

  if (!isFormData) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth && accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(url.toString(), {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const data = await safeParse(response);

  if (!response.ok) {
    if (auth && response.status === 401 && retryOnAuthFailure) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return request(path, { ...options, retryOnAuthFailure: false });
      }
    }
    throw toAuthError(response.status, data);
  }

  return data;
};

const normalizeRedirectPath = (redirectTo) => {
  if (!redirectTo) {
    return null;
  }

  if (redirectTo.startsWith('http://') || redirectTo.startsWith('https://')) {
    return redirectTo;
  }

  return redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
};

const auth = {
  async me() {
    return request('/auth/me');
  },

  async updateMe(payload) {
    return request('/users/me', {
      method: 'PATCH',
      body: payload,
    });
  },

  async login(payload) {
    const response = await request('/auth/login', {
      method: 'POST',
      body: payload,
      auth: false,
    });

    if (response?.tokens) {
      setTokens(response.tokens);
    }

    return response;
  },

  async register(payload) {
    const response = await request('/auth/register', {
      method: 'POST',
      body: payload,
      auth: false,
    });

    if (response?.tokens) {
      setTokens(response.tokens);
    }

    return response;
  },

  async logout(redirectTo) {
    try {
      if (accessToken) {
        await request('/auth/logout', { method: 'POST' });
      }
    } catch (_error) {
      // no-op
    } finally {
      clearTokens();
    }

    const target = normalizeRedirectPath(redirectTo);
    if (target) {
      window.location.href = target;
    }
  },

  redirectToLogin(fromUrl) {
    const from = fromUrl || window.location.href;
    window.location.href = `/Login?from=${encodeURIComponent(from)}`;
  },

  async deleteMePermanent() {
    return request('/users/me/permanent', { method: 'DELETE' });
  },
};

const entities = {
  NotaFiscal: {
    async filter(filter = {}, sort) {
      return request('/notas-fiscais', {
        query: {
          ...filter,
          sort,
        },
      });
    },

    async create(payload) {
      return request('/notas-fiscais', {
        method: 'POST',
        body: normalizeNotaFiscalPayload(payload),
      });
    },

    async update(id, payload) {
      return request(`/notas-fiscais/${id}`, {
        method: 'PATCH',
        body: normalizeNotaFiscalPayload(payload),
      });
    },

    async delete(id) {
      return request(`/notas-fiscais/${id}`, {
        method: 'DELETE',
      });
    },
  },
};

const integrations = {
  Core: {
    async UploadFile({ file }) {
      const form = new FormData();
      form.append('file', file);

      const response = await request('/upload/file', {
        method: 'POST',
        body: form,
      });

      return {
        ...response,
        file_url: response.file_url ?? response.url,
      };
    },

    async InvokeLLM(payload) {
      return request('/ai/extract-nota', {
        method: 'POST',
        body: payload,
      });
    },
  },
};

const appLogs = {
  async logUserInApp(_pageName) {
    return { success: true };
  },
};

export const base44 = {
  auth,
  entities,
  integrations,
  appLogs,
};
