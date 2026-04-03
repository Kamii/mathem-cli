import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { MathemApi } from './mathem-api.js';

const hasCredentials = !!process.env.MATHEM_USERNAME;

describe('Integration: search (no auth)', () => {
  it('should return results for a common query', async () => {
    const api = new MathemApi();
    const result = await api.search('mjölk', 1, 5);

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].attributes.full_name).toBeTruthy();
    expect(result.items[0].attributes.gross_price).toBeTruthy();
    expect(result.items[0].attributes.id).toBeGreaterThan(0);
    expect(result.attributes.query_string).toBe('mjölk');
  });

  it('should handle pagination params', async () => {
    const api = new MathemApi();
    const result = await api.search('bröd', 1, 3);

    expect(result.items.length).toBeLessThanOrEqual(3);
    expect(result.attributes.has_more_items).toBe(true);
  });
});

describe.skipIf(!hasCredentials)('Integration: auth + cart', () => {
  const api = new MathemApi();

  beforeAll(async () => {
    await api.login(process.env.MATHEM_USERNAME!, process.env.MATHEM_PASSWORD!);
  });

  afterAll(async () => {
    try {
      await api.clearCart();
      await api.logout();
    } catch {
      // ignore cleanup errors
    }
  });

  it('should get empty cart after clear', async () => {
    await api.clearCart();
    const cart = await api.getCart();
    expect(cart.product_quantity_count).toBe(0);
  });

  it('should add item to cart', async () => {
    const cart = await api.addToCart([{ productId: 2183, quantity: 1 }]);
    expect(cart.product_quantity_count).toBeGreaterThanOrEqual(1);
  });

  it('should remove item from cart', async () => {
    const before = await api.getCart();
    const cart = await api.removeFromCart(2183);
    expect(cart.product_quantity_count).toBeLessThan(before.product_quantity_count);
  });

  it('should clear cart', async () => {
    await api.addToCart([{ productId: 2183, quantity: 1 }]);
    const cart = await api.clearCart();
    expect(cart.product_quantity_count).toBe(0);
  });
});
