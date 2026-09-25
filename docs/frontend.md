# Frontend

## Setup and tech stack

The frontend is built with React and Vite. It uses React Router for page navigation.

In `vite.config.js`, I set up a proxy so any request to `/api` gets forwarded to the Express server on port 3001. This keeps the frontend code clean because it can use relative paths like `/api/products`, and it avoids CORS issues during local development.

## State management

I chose not to pull in Redux, Zustand, or any other external state library. For a 6-page application, React's built-in `Context` API is more than enough:

- `AuthContext`: Tracks the current user, stores the JWT in `localStorage`, and handles login/logout.
- `CartContext`: Loads the user's cart on startup, handles line item additions, quantity changes, variant switches, and cart clearing. It uses optimistic UI updates so the cart feels snappy, but rolls back the state if the server returns an error.
- `WishlistContext`: Tracks product-level saved items and handles adding, removing, and moving items to the cart.



## Pages and key flows

1. **Login (**`LoginPage.jsx`**):**
  Unauthenticated users get redirected here by the `useAuthGuard` hook. To save reviewers time, there is a visible box right on the page showing the demo credentials (`ada@copperandgrain.test` / `brew-demo-1847`), along with a "Fill demo credentials" button that fills the inputs instantly.
2. **Catalog (**`ProductListingPage.jsx`**):**
  Shows all 15 products in a responsive grid. If a product has multiple options, the card shows a clear badge (like "2 options" or "3 options") so the customer knows there is a choice to make.
3. **Product Detail (**`ProductDetailPage.jsx`**):**
  Shows the full description, price, and variant selector. Picking a different variant instantly updates the displayed price and the stock remaining for that specific option. If a variant has 0 stock, the add-to-cart button disables and shows "Out of stock".
4. **Cart (**`CartPage.jsx`**):**
  Lists cart items with quantity steppers and subtotal calculations. A nice touch here is that customers can switch variants directly inside the cart (for example, switching burr types) without having to go back to the product page. When empty, it renders a real empty state with a link back to the catalog.
5. **Wishlist (**`WishlistPage.jsx`**):**
  Handles moving items to the cart with a specific rule:
  - If the item only has one variant, it moves straight into the cart (or increments the quantity if it was already there).
  - If the item has multiple variants, it does not guess. It takes the customer to the product page so they can choose the option they actually want.
6. **Checkout (**`CheckoutPage.jsx`**):**
  Reviews the order summary and lets the user place the order. If the backend returns a 409 stock conflict, the page does not crash or dump the cart. It shows an alert explaining exactly which item fell short and leaves the user on the page so they can fix their cart.



## Styling and visual identity

Instead of pulling in a heavy component library that makes the app look like a generic template, I wrote a small, custom stylesheet based on CSS variables (`tokens.css`). 

The visual identity is called "Copper & Grain", themed around artisanal coffee equipment:

- Colors: Warm off-white background (#f6f6f4), dark charcoal body text (`#1a1a1a`), light borders (`#e5e5df`), and a deep terracotta accent (`#b84a32`) used only for main buttons.
- Typography: Georgia for headings, clean system sans-serif for UI text, and monospace for prices and stock counts.
- Responsiveness: The product grid shifts cleanly from 1 column on mobile (375px), to 2 columns on tablet (768px), to 4 columns on desktop (1280px). No horizontal scrolling anywhere.

