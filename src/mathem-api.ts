import type {
  Cart,
  LoginResponse,
  LogoutResponse,
  MathemConfig,
  SearchResult,
} from './types.js';

const DEFAULT_BASE_URL = 'https://www.mathem.se/api/v1';
const USER_AGENT = 'mathem-cli/1.0.0';

export class MathemApi {
  private baseUrl: string;
  private cookies = new Map<string, string>();

  constructor(config?: MathemConfig) {
    this.baseUrl = config?.baseUrl ?? DEFAULT_BASE_URL;
  }

  private getCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  private extractCookies(response: Response): void {
    const setCookies = response.headers.getSetCookie?.() ?? [];
    for (const header of setCookies) {
      const match = header.match(/^([^=]+)=([^;]*)/);
      if (match) {
        this.cookies.set(match[1], match[2]);
      }
    }
  }

  private getCsrfToken(): string | undefined {
    return this.cookies.get('csrftoken');
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'User-Agent': USER_AGENT,
      'Referer': 'https://www.mathem.se/',
      ...(options.headers as Record<string, string>),
    };

    const cookieHeader = this.getCookieHeader();
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const csrfToken = this.getCsrfToken();
    if (csrfToken && options.method && options.method !== 'GET') {
      headers['X-CSRFToken'] = csrfToken;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      redirect: 'manual',
    });

    this.extractCookies(response);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new MathemApiError(response.status, body, path);
    }

    return response.json() as Promise<T>;
  }

  async init(): Promise<void> {
    // Load the login page to get the CSRF cookie
    const response = await fetch('https://www.mathem.se/se/user/login/', {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'manual',
    });
    this.extractCookies(response);
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    // Ensure we have a CSRF token first
    if (!this.getCsrfToken()) {
      await this.init();
    }

    return this.request<LoginResponse>('/user/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  }

  async logout(): Promise<LogoutResponse> {
    return this.request<LogoutResponse>('/user/logout/', {
      method: 'POST',
    });
  }

  async search(
    query: string,
    page = 1,
    size = 10,
  ): Promise<SearchResult> {
    const params = new URLSearchParams({
      q: query,
      type: 'product',
      page: String(page),
      size: String(size),
    });

    // Search doesn't require auth, but we need CSRF cookie for session
    if (!this.getCsrfToken()) {
      await this.init();
    }

    return this.request<SearchResult>(`/search/mixed/?${params}`);
  }

  async getCart(): Promise<Cart> {
    return this.request<Cart>('/cart/?group-by=recipes');
  }

  async addToCart(
    items: Array<{ productId: number; quantity: number }>,
  ): Promise<Cart> {
    return this.request<Cart>('/cart/items/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
      }),
    });
  }

  async removeFromCart(productId: number): Promise<Cart> {
    return this.request<Cart>('/cart/items/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ product_id: productId, quantity: -1, delete: true }],
      }),
    });
  }

  async clearCart(): Promise<Cart> {
    return this.request<Cart>('/cart/clear/', {
      method: 'POST',
    });
  }
}

export class MathemApiError extends Error {
  constructor(
    public status: number,
    public body: string,
    public path: string,
  ) {
    let detail = '';
    try {
      const parsed = JSON.parse(body);
      if (parsed.errors) {
        detail = typeof parsed.errors === 'string'
          ? parsed.errors
          : JSON.stringify(parsed.errors);
      }
    } catch {
      detail = body.substring(0, 200);
    }
    super(`Mathem API error ${status} on ${path}: ${detail}`);
    this.name = 'MathemApiError';
  }
}
