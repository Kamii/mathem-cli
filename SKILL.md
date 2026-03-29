# Mathem CLI Skill

Use this skill to interact with Mathem.se, a Swedish online grocery store.

## Available Commands

### Search Products
```bash
mathem-cli search <query> [count]
```
Search for products on Mathem.se. No authentication required.

### View Cart
```bash
mathem-cli -u <email> -p <password> cart
```
Show the current shopping cart contents.

### Add to Cart
```bash
mathem-cli -u <email> -p <password> add <product-id> [quantity]
```
Add a product to the cart. Use the product ID from search results.

### Remove from Cart
```bash
mathem-cli -u <email> -p <password> remove <product-id>
```
Remove a product from the cart.

### Clear Cart
```bash
mathem-cli -u <email> -p <password> clear
```
Remove all items from the cart.

## Authentication

Credentials can be provided via:
- Flags: `-u <email> -p <password>`
- Environment variables: `MATHEM_USERNAME`, `MATHEM_PASSWORD`
- `.env` file

## Typical Workflow

1. Search for products: `mathem-cli search "mjölk"`
2. Note the product IDs from results
3. Add items: `mathem-cli -u user -p pass add 2183 2`
4. Review cart: `mathem-cli -u user -p pass cart`
