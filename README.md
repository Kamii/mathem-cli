# mathem-cli

A command-line tool for interacting with [Mathem.se](https://www.mathem.se), Sweden's online grocery store.

Search products, manage your shopping cart, and more — all from the terminal.

## Installation

```bash
npm install -g mathem-cli
```

Or use directly:

```bash
npx mathem-cli search mjölk
```

## Usage

### Search Products (no login required)

```bash
mathem-cli search "mjölk"
mathem-cli search "pasta" 20
```

### Cart Operations (requires login)

```bash
# Via flags
mathem-cli -u your@email.com -p yourpassword cart
mathem-cli -u your@email.com -p yourpassword add 2183 2
mathem-cli -u your@email.com -p yourpassword remove 2183
mathem-cli -u your@email.com -p yourpassword clear

# Via environment variables
export MATHEM_USERNAME=your@email.com
export MATHEM_PASSWORD=yourpassword
mathem-cli cart
mathem-cli add 2183
```

You can also use a `.env` file:

```env
MATHEM_USERNAME=your@email.com
MATHEM_PASSWORD=yourpassword
```

### Claude Code Integration

```bash
mathem-cli --install-skills
```

## Library Usage

```typescript
import { MathemApi } from 'mathem-cli';

const api = new MathemApi();

// Search (no auth needed)
const results = await api.search('mjölk');
console.log(results.items);

// Login + cart
await api.login('your@email.com', 'password');
await api.addToCart([{ productId: 2183, quantity: 2 }]);
const cart = await api.getCart();
console.log(cart);
```

## License

MIT
