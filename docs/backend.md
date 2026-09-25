# Backend

## Structure and layout

The backend is a Node.js Express service organized into basic layers:

- `src/routes/`: Route definitions that wire URLs to controller methods.
- `src/controllers/`: Pulls data out of requests, calls the services, and sends back HTTP status codes and JSON.
- `src/services/`: All the business logic, SQL queries, and database transactions.
- `src/db/`: Connection setup, pragmas, schema SQL, and the seed script.
- `src/middleware/`: Auth verification and the centralized error handler.

Keeping services separate from controllers means the routes stay readable and the business logic is easy to test directly.

## Why a monorepo?

This project uses npm workspaces with `backend` and `frontend` in one repo. 

For a project of this size, splitting this into two repositories would just add coordination overhead. A split repo means two separate repos to clone, two PRs for any full-stack change, and extra work keeping API contracts aligned. A monorepo lets me run everything locally with one command (`npm run dev`) and keeps the git history in one place.

## Authentication

I kept auth straightforward and honest for a take-home:

- One seeded demo user (`ada@copperandgrain.test` with password `brew-demo-1847`).
- Passwords hashed with `bcrypt`.
- A simple JWT returned on `POST /api/auth/login`.
- The `auth.js` middleware checks the `Authorization: Bearer <token>` header on cart, wishlist, and checkout routes.
- The product catalog routes (`GET /api/products`) are technically public at the API level, but the frontend keeps unauthenticated users on the login page until they sign in.

## Checkout and stock handling (`POST /api/orders`)

Checkout is where e-commerce apps usually break if multiple requests hit at once. 

I wrapped the entire checkout flow in an explicit `better-sqlite3` transaction using `db.transaction(...)`. Here is what happens inside that single atomic block:

1. Grab all items currently in the user's cart.
2. Re-check the current stock for every single variant against the requested quantity.
3. If even one item has less stock than requested, throw an `InsufficientStockError`. This automatically rolls back the entire transaction. Nothing is decremented, and the cart is not cleared.
4. If everything is available, decrement each variant's stock, insert the order, save the order line item snapshots, and clear the user's cart.

When stock is short, the controller catches the error and returns a clean `409 Conflict`:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Only 1 unit of 'Borosilicate French Press (800 ml)' remain in stock.",
    "details": {
      "variantId": 14,
      "availableStock": 1
    }
  }
}
```
The cart items stay in place so the customer can see what happened, adjust their quantity, and try again.

Cart clamping and merging
In cart.service.js:

If you try to add or update an item to a quantity higher than what is on the shelf, the backend clamps it to the maximum available stock and returns a message informing the user (Added 3 items (maximum available stock)).

If you add a variant that is already in your cart, it increments the existing row's quantity (up to available stock) instead of failing on the unique key constraint or creating a duplicate line.

Error handling
All async controllers are wrapped with an asyncHandler helper so unhandled errors go straight to errorHandler.js.

The error middleware returns consistent JSON ({ "error": { "code", "message", "details" } }) and logs the full stack trace to the console without leaking internal details back to the client.