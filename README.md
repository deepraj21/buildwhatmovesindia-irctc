# Railway Journey Planner API

Express API for a multi-page rail booking flow with direct-train and delay-aware multi-hop analysis.

### Local API

```sh
cd server
npm install
cp .env.example .env
# Set MONGODB_URI to your local MongoDB or MongoDB Atlas connection string.
npm run seed
npm start
```

The server runs on `http://localhost:3000` by default. `npm run seed` is safe to run again; it updates the dummy stations and trains instead of duplicating them. See [the product and API plan](docs/product-and-api-plan.md) for the user flow and [the API reference](server/API_DOC.md) for the client integration contract.

```sh
cd server
npm test
```

### Vercel deployment

Deploy `client/` and `server/` as separate Vercel projects. The client project uses the `client/vercel.json` SPA fallback; the server project uses the `server/vercel.json` Express function route.

Set `VITE_API_BASE_URL` in the client project to the deployed API URL ending in `/api/v1`. Set `MONGODB_URI` in the server project to a MongoDB Atlas connection string. `PORT` is managed by Vercel and is not required there.
