import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MathemApi } from './mathem-api.js';

const mockSearchResponse = {
  type: 'product',
  attributes: {
    items: 2,
    page: 1,
    has_more_items: false,
    query_string: 'mjölk',
    filters: '',
  },
  items: [
    {
      id: 2183,
      type: 'product',
      attributes: {
        id: 2183,
        full_name: 'Garant Mellanmjölk 1,5%',
        brand: 'Garant',
        brand_id: 5,
        name: 'Mellanmjölk 1,5%',
        name_extra: '1,5 l',
        front_url: 'https://www.mathem.se/se/products/2183/',
        absolute_url: '/se/products/2183/',
        gross_price: '17.50',
        gross_unit_price: '11.67',
        unit_price_quantity_abbreviation: 'l',
        unit_price_quantity_name: 'liter',
        currency: 'SEK',
        discount: null,
        promotion: { title: 'Prismatch', description_short: 'price_match', accessibility_text: '', display_style: 'price_match' },
        promotions: [],
        availability: { is_available: true, description: '', description_short: '', code: 'available' },
        images: [],
        client_classifiers: [],
      },
      tracking_properties: {},
    },
    {
      id: 4664,
      type: 'product',
      attributes: {
        id: 4664,
        full_name: 'Arla Ko Standardmjölk 3%',
        brand: 'Arla Ko',
        brand_id: 3692,
        name: 'Standardmjölk 3%',
        name_extra: '1,5 l',
        front_url: 'https://www.mathem.se/se/products/4664/',
        absolute_url: '/se/products/4664/',
        gross_price: '17.95',
        gross_unit_price: '11.97',
        unit_price_quantity_abbreviation: 'l',
        unit_price_quantity_name: 'liter',
        currency: 'SEK',
        discount: null,
        promotion: null,
        promotions: [],
        availability: { is_available: true, description: '', description_short: '', code: 'available' },
        images: [],
        client_classifiers: [],
      },
      tracking_properties: {},
    },
  ],
  filters: [],
};

const mockInitResponse = new Response('{}', {
  status: 200,
  headers: { 'Set-Cookie': 'csrftoken=testtoken123; Path=/' },
});

describe('MathemApi.search', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should parse search results correctly', async () => {
    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('type=suggestion')) {
        callCount++;
        return new Response('{}', {
          status: 200,
          headers: new Headers([['Set-Cookie', 'csrftoken=testtoken123; Path=/']]),
        });
      }
      callCount++;
      return new Response(JSON.stringify(mockSearchResponse), {
        status: 200,
        headers: new Headers([['Set-Cookie', 'csrftoken=testtoken123; Path=/']]),
      });
    });

    const api = new MathemApi();
    const result = await api.search('mjölk');

    expect(result.items).toHaveLength(2);
    expect(result.items[0].attributes.full_name).toBe('Garant Mellanmjölk 1,5%');
    expect(result.items[0].attributes.gross_price).toBe('17.50');
    expect(result.items[0].attributes.id).toBe(2183);
    expect(result.items[1].attributes.brand).toBe('Arla Ko');
    expect(result.attributes.query_string).toBe('mjölk');
  });

  it('should include query params in search URL', async () => {
    let searchUrl = '';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('type=suggestion')) {
        return new Response('{}', {
          status: 200,
          headers: new Headers([['Set-Cookie', 'csrftoken=test; Path=/']]),
        });
      }
      searchUrl = urlStr;
      return new Response(JSON.stringify(mockSearchResponse), {
        status: 200,
        headers: new Headers(),
      });
    });

    const api = new MathemApi();
    await api.search('test query', 2, 20);

    expect(searchUrl).toContain('q=test+query');
    expect(searchUrl).toContain('type=product');
    expect(searchUrl).toContain('page=2');
    expect(searchUrl).toContain('size=20');
  });
});

describe('MathemApi.login', () => {
  it('should send username and password', async () => {
    let loginBody = '';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('type=suggestion')) {
        return new Response('{}', {
          status: 200,
          headers: new Headers([['Set-Cookie', 'csrftoken=csrf123; Path=/']]),
        });
      }
      loginBody = options?.body as string;
      return new Response(
        JSON.stringify({ is_authenticated: true, sessionid: 'sess123' }),
        {
          status: 200,
          headers: new Headers([['Set-Cookie', 'sessionid=sess123; Path=/']]),
        },
      );
    });

    const api = new MathemApi();
    const result = await api.login('user@example.com', 'pass123');

    expect(JSON.parse(loginBody)).toEqual({
      username: 'user@example.com',
      password: 'pass123',
    });
    expect(result.is_authenticated).toBe(true);
  });
});

describe('MathemApi.cart', () => {
  it('should send correct body for addToCart', async () => {
    let requestBody = '';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('type=suggestion')) {
        return new Response('{}', {
          status: 200,
          headers: new Headers([['Set-Cookie', 'csrftoken=csrf123; Path=/']]),
        });
      }
      if (urlStr.includes('/user/login')) {
        return new Response(JSON.stringify({ is_authenticated: true, sessionid: 's' }), {
          status: 200,
          headers: new Headers([['Set-Cookie', 'sessionid=s; Path=/']]),
        });
      }
      if (options?.body) requestBody = options.body as string;
      return new Response(
        JSON.stringify({ product_quantity_count: 2, display_price: '35.00' }),
        { status: 200, headers: new Headers() },
      );
    });

    const api = new MathemApi();
    await api.login('user', 'pass');
    await api.addToCart([{ productId: 2183, quantity: 2 }]);

    expect(JSON.parse(requestBody)).toEqual({
      items: [{ product_id: 2183, quantity: 2 }],
    });
  });

  it('should send delete flag for removeFromCart', async () => {
    let requestBody = '';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('type=suggestion')) {
        return new Response('{}', {
          status: 200,
          headers: new Headers([['Set-Cookie', 'csrftoken=csrf123; Path=/']]),
        });
      }
      if (urlStr.includes('/user/login')) {
        return new Response(JSON.stringify({ is_authenticated: true, sessionid: 's' }), {
          status: 200,
          headers: new Headers([['Set-Cookie', 'sessionid=s; Path=/']]),
        });
      }
      if (options?.body) requestBody = options.body as string;
      return new Response(
        JSON.stringify({ product_quantity_count: 0, display_price: '0.00' }),
        { status: 200, headers: new Headers() },
      );
    });

    const api = new MathemApi();
    await api.login('user', 'pass');
    await api.removeFromCart(2183);

    expect(JSON.parse(requestBody)).toEqual({
      items: [{ product_id: 2183, quantity: -1, delete: true }],
    });
  });
});
