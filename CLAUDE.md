# mathem-cli

TypeScript CLI and library for interacting with Mathem.se grocery store API.

## Development

```bash
npm install
npm run build        # Compile TypeScript
npm start -- search mjölk   # Run directly with tsx
npm test             # Run all tests
npm run test:unit    # Unit tests only
npm run test:integration    # Integration tests (needs MATHEM_USERNAME)
```

## Architecture

- `src/mathem-api.ts` — `MathemApi` class with all API methods, cookie/CSRF management
- `src/cli.ts` — CLI entry point with argument parsing and output formatting
- `src/types.ts` — TypeScript interfaces matching Mathem API responses
- `src/index.ts` — Public library exports

## API Base

All endpoints: `https://www.mathem.se/api/v1/`

- Search: `GET /search/mixed/?q=&type=product` (no auth)
- Login: `POST /user/login/` with `{ username, password }`
- Cart: `GET /cart/?group-by=recipes`, `POST /cart/items/`, `POST /cart/clear/`
- CSRF: `X-CSRFToken` header from `csrftoken` cookie on all mutations
