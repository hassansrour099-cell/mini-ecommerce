# AI Methodology

## How I worked with AI

I used AI (Cursor with Claude) as a fast pair programmer on this project. My goal was to let the AI handle the repetitive typing and scaffolding while I maintained full control over the architecture, data integrity, and failure states.

## What I had the AI do

1. **Boilerplate and scaffolding:** Writing the initial Express router setups, basic controller parameter extraction, and baseline React page layouts.
2. **Catalog content:** Generating the 15 realistic coffee equipment products in `seed.js`, including sensible descriptions, realistic prices, and variant combinations that fit the "Copper & Grain" theme. Doing this by hand would have taken an hour of creative writing that adds zero technical signal.
3. **CSS baseline:** Setting up the CSS custom properties from the color and font rules I gave it.
4. **Drafting the test script:** Putting together the initial structure for the end-to-end smoke test script.

## Where I had to steer and correct the AI

AI tools tend to write code that only works on the happy path. If you do not give them hard constraints, they will write naive implementations that fail in production. Here are the main areas where I stepped in:

1. **Variant-only inventory:** 
   The initial tendency for AI models is to put `stock_quantity` on both the product and the variant tables. I rejected that and enforced that stock lives exclusively on variants, with single-option items getting a default variant row. This prevented having two competing stock code paths across the app.
2. **SQLite pragmas:** 
   AI boilerplate almost always connects to SQLite without configuring pragmas. I made sure we explicitly enabled WAL mode, foreign keys, synchronous normal, and a 5 second busy timeout.
3. **Atomic checkout transactions:** 
   The AI originally suggested running sequential SQL queries for stock checking, decrementing, and order creation. I forced it inside a `better-sqlite3` synchronous transaction (`db.transaction`) so that any stock failure triggers a complete rollback and returns a clean 409 Conflict.
4. **Wishlist variant logic:** 
   When asked to move wishlist items to the cart, the AI initially guessed the first variant for multi-variant products. I changed this to navigate the user to the product page instead, because guessing what a customer wants is bad UX.
5. **No AI visual template:** 
   I explicitly banned purple gradients, soft floating cards, and default unstyled fonts. I gave it a specific, restrained color palette and typography rules to keep the UI looking like a real, thoughtfully built store.

## How I verified the output

I did not trust any AI-generated code until I tested it:

- **Automated test (`npm run test:e2e`):** I had a smoke test script built that runs against the database. In about one second, it signs in, verifies the catalog, tests cart additions, places an order, checks that stock dropped, and asserts that attempting to order beyond stock returns a 409 with the right error shape.
- **Manual browser testing:** I tested all four core flows in the browser across mobile, tablet, and desktop viewport sizes.
- **Database inspection:** After running checkout, I opened SQLite directly to verify that the order line items captured immutable price and title snapshots, and that stock counts decremented accurately.