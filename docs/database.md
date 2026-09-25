# Database

I chose SQLite with `better-sqlite3` for this project. For a single-node application of this scale, an embedded database avoids network overhead, simplifies local setup to zero external dependencies, and provides deterministic synchronous execution.

The database file is stored at `backend/data/shop.db` and is generated fresh whenever you run `npm run seed`.

## Connection settings (Pragmas)

SQLite needs a few settings turned on right away or it behaves in ways you do not want in a web app. In `backend/src/db/connection.js`, I run these four pragmas on startup:

- `PRAGMA journal_mode = WAL;` (Write-Ahead Logging lets readers and writers run concurrently without blocking each other)
- `PRAGMA foreign_keys = ON;` (SQLite turns foreign keys off by default, so this must be enabled for foreign keys and cascades to work)
- `PRAGMA synchronous = NORMAL;` (Safe against crashes while cutting down on unnecessary disk writes)
- `PRAGMA busy_timeout = 5000;` (Waits up to 5 seconds if the file is busy instead of instantly failing with an error)

## Schema and key decisions

The schema defines seven tables: `users`, `products`, `product_variants`, `cart_items`, `wishlist_items`, `orders`, and `order_items`.

### 1. Stock and pricing live only on variants

The most important decision in the schema was putting inventory and price strictly on `product_variants`, not on `products`. 

Every product has at least one variant row. If an item has only one style (like our digital brew scale), it gets a default variant row representing that item. If it has multiple options (like burr types on a grinder or volume on a French press), each option has its own row with its own price and stock.

This keeps the codebase clean. I only need one code path for checking stock, updating inventory, and adding items to the cart, instead of constantly checking whether a product is a standalone item or a parent of variants.

### 2. Avoiding the SQLite NULL gotcha in carts

In SQL, `NULL != NULL`. If `cart_items` had a nullable `variant_id`, then a uniqueness rule like `UNIQUE(user_id, product_id, variant_id)` would fail to prevent duplicate rows when `variant_id` was `NULL`. 

Because every product is guaranteed to have a variant row, `variant_id` on `cart_items` is always required (`NOT NULL`). That means a simple `UNIQUE(user_id, variant_id)` constraint works reliably and stops duplicate cart rows without any custom query workarounds.

### 3. Integer cents for all prices

All prices are stored as integer cents (`price_cents`, `total_cents`, `price_cents_at_purchase`). Floating point numbers in JavaScript and SQL introduce rounding bugs (like `0.1 + 0.2 = 0.30000000000000004`). Storing cents keeps all math exact. Converting to dollars and cents only happens in the UI.

### 4. Freezing order history

When a customer buys something, the price and title they saw at that moment must stay preserved forever. 

`order_items` saves copies of `product_title_snapshot`, `variant_name_snapshot`, and `price_cents_at_purchase`. If I change a product title or raise its price tomorrow, older orders stay completely accurate.

### 5. Check constraints

I added database-level checks (`CHECK (stock_quantity >= 0)` and `CHECK (quantity > 0)`). Even if someone writes a bug in the application layer, the database itself will physically refuse to save negative stock or zero-quantity cart items.