#!/usr/bin/env node

import 'dotenv/config';
import { MathemApi, MathemApiError } from './mathem-api.js';
import type { Cart, SearchItem } from './types.js';

function usage(): void {
  console.log(`Usage: mathem-cli [options] <command> [args]

Commands:
  search <query> [count]    Search products (default count: 10)
  cart                      Show current cart
  add <product-id> [qty]    Add item to cart (default qty: 1)
  remove <product-id>       Remove item from cart
  clear                     Clear entire cart

Options:
  -u, --username <email>    Mathem username/email
  -p, --password <pass>     Mathem password
  --help-llm                Show LLM-friendly help (structured markdown)
  -h, --help                Show this help

Environment variables:
  MATHEM_USERNAME            Username/email
  MATHEM_PASSWORD            Password

You can also use a .env file with the above variables.
`);
}

function llmHelp(): void {
  console.log(`# mathem-cli

CLI and library for Mathem.se, a Swedish online grocery store.

## Commands

### search <query> [count]
Search for products. No authentication required.
- query: search term (e.g. "mjölk", "pasta", "kycklingfilé")
- count: max results to return (default: 10)
- Output: numbered list with product name, price, unit price, and product ID
- Example: \`mathem-cli search "mjölk" 5\`

### cart
Show the current shopping cart. Requires authentication.
- Output: item list with quantities, prices, and totals
- Example: \`mathem-cli -u user@email.com -p pass cart\`

### add <product-id> [qty]
Add a product to the cart. Requires authentication.
- product-id: numeric ID from search results
- qty: quantity to add (default: 1)
- Example: \`mathem-cli -u user@email.com -p pass add 2183 2\`

### remove <product-id>
Remove one unit of a product from the cart. Requires authentication.
- product-id: numeric ID of the product to remove
- Example: \`mathem-cli -u user@email.com -p pass remove 2183\`

### clear
Remove all items from the cart. Requires authentication.
- Example: \`mathem-cli -u user@email.com -p pass clear\`

## Authentication

Credentials can be provided in three ways (checked in order):
1. Flags: \`-u <email> -p <password>\`
2. Environment variables: MATHEM_USERNAME, MATHEM_PASSWORD
3. .env file with the above variables

Search works without authentication. All cart operations require login.

## Typical workflow

1. Search for a product: \`mathem-cli search "mjölk"\`
2. Note the product ID from the results (e.g. 2183)
3. Add it to cart: \`mathem-cli add 2183\`
4. Review the cart: \`mathem-cli cart\`
5. Remove an item if needed: \`mathem-cli remove 2183\`
6. Clear the entire cart: \`mathem-cli clear\`

## Library usage (Node.js / TypeScript)

\`\`\`typescript
import { MathemApi } from 'mathem-cli';

const api = new MathemApi();

// Search (no auth)
const results = await api.search('mjölk', 1, 10);
// results.items[].attributes: { id, full_name, brand, gross_price, gross_unit_price, unit_price_quantity_abbreviation, availability, ... }

// Login + cart operations
await api.login('email', 'password');
await api.addToCart([{ productId: 2183, quantity: 2 }]);
const cart = await api.getCart();
// cart: { product_quantity_count, display_price, total_gross_amount, items[].product, items[].quantity, ... }
await api.removeFromCart(2183);
await api.clearCart();
await api.logout();
\`\`\`
`);
}

function formatProduct(item: SearchItem, index: number): string {
  const p = item.attributes;
  const available = p.availability.is_available ? '' : ' [UNAVAILABLE]';
  const promo = p.promotion ? ` (${p.promotion.title})` : '';
  return [
    `  ${index + 1}. ${p.full_name}${available}${promo}`,
    `     ${p.gross_price} ${p.currency} | ${p.gross_unit_price} ${p.currency}/${p.unit_price_quantity_abbreviation}`,
    `     ID: ${p.id} | ${p.name_extra}`,
  ].join('\n');
}

function formatCart(cart: Cart): string {
  if (cart.product_quantity_count === 0) {
    return '  Cart is empty.';
  }

  const lines: string[] = [];
  lines.push(`  ${cart.label_text} | ${cart.display_price} ${cart.currency}`);
  lines.push('');

  if (cart.items) {
    for (const item of cart.items) {
      const p = item.product;
      lines.push(
        `  ${item.quantity}x ${p.full_name} — ${p.gross_price} ${p.currency} (ID: ${p.id})`,
      );
    }
    lines.push('');
  }

  for (const group of cart.summary_lines) {
    for (const line of group.lines) {
      const prefix = line.display_style === 'primary' ? '  ' : '    ';
      lines.push(`${prefix}${line.description}: ${line.gross_amount} ${cart.currency}`);
    }
  }

  return lines.join('\n');
}

interface ParsedArgs {
  username?: string;
  password?: string;
  command?: string;
  args: string[];
}

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { args: [] };
  let i = 0;

  while (i < argv.length) {
    const arg = argv[i];
    switch (arg) {
      case '-u':
      case '--username':
        result.username = argv[++i];
        break;
      case '-p':
      case '--password':
        result.password = argv[++i];
        break;
      case '-h':
      case '--help':
        usage();
        process.exit(0);
      case '--help-llm':
        llmHelp();
        process.exit(0);
      default:
        if (!result.command) {
          result.command = arg;
        } else {
          result.args.push(arg);
        }
    }
    i++;
  }

  return result;
}

async function ensureLogin(
  api: MathemApi,
  username?: string,
  password?: string,
): Promise<void> {
  const user = username ?? process.env.MATHEM_USERNAME;
  const pass = password ?? process.env.MATHEM_PASSWORD;

  if (!user || !pass) {
    console.error(
      'Error: Username and password required. Use -u/-p flags, environment variables, or .env file.',
    );
    process.exit(1);
  }

  await api.login(user, pass);
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  if (!parsed.command) {
    usage();
    process.exit(1);
  }

  const api = new MathemApi();

  try {
    switch (parsed.command) {
      case 'search': {
        const query = parsed.args[0];
        if (!query) {
          console.error('Error: Search query required.');
          process.exit(1);
        }
        const count = parsed.args[1] ? parseInt(parsed.args[1], 10) : 10;
        const result = await api.search(query, 1, count);
        console.log(
          `Found ${result.attributes.items} products for "${result.attributes.query_string}":`,
        );
        console.log();
        for (let i = 0; i < result.items.length; i++) {
          console.log(formatProduct(result.items[i], i));
        }
        if (result.attributes.has_more_items) {
          console.log(`\n  ... and more results available.`);
        }
        break;
      }

      case 'cart': {
        await ensureLogin(api, parsed.username, parsed.password);
        const cart = await api.getCart();
        console.log('Cart:');
        console.log(formatCart(cart));
        break;
      }

      case 'add': {
        const productId = parsed.args[0];
        if (!productId) {
          console.error('Error: Product ID required.');
          process.exit(1);
        }
        const qty = parsed.args[1] ? parseInt(parsed.args[1], 10) : 1;
        await ensureLogin(api, parsed.username, parsed.password);
        const cart = await api.addToCart([
          { productId: parseInt(productId, 10), quantity: qty },
        ]);
        console.log(`Added ${qty}x product ${productId} to cart.`);
        console.log(formatCart(cart));
        break;
      }

      case 'remove': {
        const productId = parsed.args[0];
        if (!productId) {
          console.error('Error: Product ID required.');
          process.exit(1);
        }
        await ensureLogin(api, parsed.username, parsed.password);
        const cart = await api.removeFromCart(parseInt(productId, 10));
        console.log(`Removed product ${productId} from cart.`);
        console.log(formatCart(cart));
        break;
      }

      case 'clear': {
        await ensureLogin(api, parsed.username, parsed.password);
        const cart = await api.clearCart();
        console.log('Cart cleared.');
        console.log(formatCart(cart));
        break;
      }

      default:
        console.error(`Unknown command: ${parsed.command}`);
        usage();
        process.exit(1);
    }
  } catch (error) {
    if (error instanceof MathemApiError) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

main();
