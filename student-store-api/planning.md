# Data Models
### Product
Name          | Prisma data type
--------------|--------------------------------------
`id`          | `Int @id @default(autoincrement())`
`name`        | `String`
`description` | `String?`
`price`       | `Float`
`image_url`   | `String? @default("https://www.fairfaxbar.org/global_graphics/default-store-350x350.jpg")`
`category`    | `String? @default("uncategorized")`

- Foreign Keys: None
- Cascade Behavior: Product is parent record, nothing happens when deleted

### Order
Name                 | Prisma data type
---------------------|--------------------------------------
`order_id`           | `Int @id @default(autoincrement())`
`customer_id`        | `Int`
`total_price`        | `Float @default(0)`
`status`             | `String? @default("pending")`
`created_at`         | `DateTime @default(now())`
`order_items`        | `OrderItem[]`

- Foreign Keys: None
- Cascade Behavior: Order is parent record, nothing happens when deleted

### OrderItem
Name                 | Prisma data type
---------------------|---------------------------------------------------------------
`order_item_id`      | `Int @id @default(autoincrement())`
`order_id`           | `Int`
`order`              | `Order @relation(fields: [order_id], references: [order_id])`
`product_id`         | `Int`
`product`            | `Product @relation(fields: [product_id], references: [id])`
`quantity`           | `Int @default(1)`
`price`              | `Float`

- Foreign Keys: order_id, product_id
- Cascade Behavior: When Order or Product is deleted, OrderItem should be deleted.

# API Contract

### Error Response Shape
{"error": "message"}

### Global errors (apply to all endpoints):
- `500 Internal Server Error` -> `{"error": "Something went wrong"}` — unexpected server/database failure

### API Endpoints
Method   | Path                   | Request Shape | Success Response | Error Cases
---------|------------------------|---------------|------------------|-------------
`GET`    | `/products`            | No body. Optional query params (see Query Parameters below): `?category=`, `?name=`, `?sort=` | `200 OK` -> array of product objects: `[{ id, name, description, price, image_url, category }, ...]` | (none specific; only the global `500`)
`GET`    | `/products/:id`        | Route param: `id` (Int). No body. | `200 OK` -> product object: `{ id, name, description, price, image_url, category }` | `404` -> `{"error": "Product not found"}`
`POST`   | `/products`            | Body: `{ name: String, description: String?, price: Float, image_url: String?, category: String? }` | `201 Created` -> new product object: `{ id, name, description, price, image_url, category }`| `400` -> `{"error": "Missing required field: name"}` (or `price`)
`PUT`    | `/products/:id`        | Body: `{ name: String?, description: String?, price: Float?, image_url: String?, category: String? }` | `200 OK` -> updated product object: `{ id, name, description, price, image_url, category }` | `404` -> `{"error": "Product not found"}`, `400` -> `{"error": "Invalid field"}`
`DELETE` | `/products/:id`        | Route param: `id` (Int). No body. | `204 No Content` | `404` -> `{"error": "Product not found"}`
`GET`    | `/orders`              | No body. No query params. | `200 OK` -> array of order objects: `[{ order_id, customer_id, total_price, status, created_at }, ...]` | (none specific; only the global `500`)
`GET`    | `/orders/:order_id`    | No body. No query params. | `200 OK` -> order with items: `{ order_id, customer_id, total_price, status, created_at, order_items: [...] }`| `404` -> `{"error": "Order not found"}`
`POST`   | `/orders`              | Body: `{ customer_id: Int, status: String?, order_items: [{ product_id: Int, quantity: Int }] }` | `201 Created` -> created order with items: `{ order_id, customer_id, total_price, status, created_at, order_items: [{ order_item_id, product_id, quantity, price }] }` | `400` -> `{"error": "order_items cannot be empty"}`, `400` -> `{"error": "Product not found for product_id: <id>"}`
`PUT`    | `/orders/:order_id`    | Body: `{ status: String }` | `200 OK` -> updated order with items: `{ order_id, customer_id, total_price, status, created_at, order_items: [...] }` | `404` -> `{"error": "Order not found"}`
`DELETE` | `/orders/:order_id`    | Route param: `order_id` (Int). No body. | `204 No Content` | `404` -> `{"error": "Order not found"}`

### Query Parameters — `GET /products`
All parameters are optional and combine (filters are applied, then sorting).

Param      | Type      | Behavior
-----------|-----------|------------------------------------------------------------------
`category` | `String`  | Exact-match filter, e.g. `?category=clothing`. An unknown category is not an error — it simply matches nothing, returning `200 OK` with `[]`.
`name`     | `String`  | Case-insensitive partial match (contains), e.g. `?name=mug`.
`sort`     | `String`  | Sort order, ascending. Allowed values: `price`, `name` (e.g. `?sort=price`). Unrecognized values are ignored (treated as no sort).

- **Default (no params)**: return all products, unordered.
- **Combining**: `?category=clothing&sort=price` returns only `clothing` products, ordered by ascending price.

Examples:
- `GET /products` → all products, unordered
- `GET /products?category=clothing` → only clothing products
- `GET /products?sort=price` → all products, cheapest first
- `GET /products?category=clothing&sort=name` → clothing products, A→Z by name
- `GET /products?category=doesnotexist` → `200 OK` with `[]`

# Transactional Flow

### `POST /orders`
This is the only endpoint that writes to multiple tables (`Order` + many `OrderItem`s) in
one logical action, so all of its database work runs inside a single Prisma transaction
(`prisma.$transaction`). Either everything below succeeds, or nothing is created.

Request body:
```json
{
  "customer_id": 5,
  "status": "pending",            // optional, defaults to "pending"
  "order_items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 7, "quantity": 1 }
  ]
}
```
Note what the client does NOT send: `order_id`, `total_price`, and each item's `price` are
all generated/computed by the server.

Steps (all inside the transaction):
1. POST request is made. Reject early with `400` if `order_items` is empty.
2. Validate every order_item: look up each `product_id` with `prisma.product.findUnique`
   (or one `findMany` for all ids) to confirm it exists and to read its real `price` from
   the database — the client's input is never trusted for price.
3. Compute `total_price` = sum of `product.price * quantity` across all items.
4. Create the Order (`prisma.order.create`) with `customer_id`, `status`, and the computed
   `total_price`. This generates the new `order_id`.
5. Create all OrderItems, each linked to the new `order_id` and storing the looked-up
   `price` and `quantity`. (Steps 4–5 can be a single nested `create` write.)

Outcomes:
- Success -> `201 Created` with the full order and its `order_items` (including each
  generated `order_item_id` and `price`, plus the rolled-up `total_price`).
- An item references a nonexistent product -> the transaction rolls back (no Order, no
  OrderItems persist) and the API returns `400` -> `{"error": "Product not found for product_id: <id>"}`.

If at any point something fails, the entire transaction is rolled back and nothing is created.

# Decisions Log — Product Model

- **Schema translation that went smoothly**: `price` as `Float` mapped cleanly to PostgreSQL,
  and keeping the schema fields in snake_case (`image_url`, `category`) means Prisma returns
  rows in the exact JSON shape the API contract specifies — so the controllers pass model
  results straight through with no field remapping.

- **Field decision I made during implementation that wasn't in the original spec**: split the
  code into three layers — a `Product` class in `models/product.js` (Prisma queries only),
  `src/controllers/productController.js` (HTTP/validation/status codes), and
  `src/routes/productRoutes.js` (route-to-handler mapping). A single file would have been
  simpler, but the separation keeps database concerns out of the HTTP layer.

- **Route behavior that needed a spec update**: `PUT /products/:id` returns `200` with the
  updated product and `DELETE /products/:id` returns `204` — both confirmed by testing, no spec
  change needed. Implementation detail: a missing record is mapped to the contract's `404` by
  catching Prisma's `P2025` ("record to update/delete not found") error rather than doing a
  separate existence check first.

- **Tooling note**: `prisma` CLI was not in the project's dependencies (only `@prisma/client`),
  so `npx prisma` pulled v7 — which rejects the v6 `url` in `schema.prisma`. Installed
  `prisma@6` as a devDependency to match the client, then ran the migration as
  `init_products_table`.

# Spec Reconciliation — Milestone 4 (Schema Audit)

### Schema vs. spec gaps found
- **No scalar-field gaps.** Every field in the planning.md Data Models tables
  (`Product`, `Order`, `OrderItem`) is present in `schema.prisma` with the documented type,
  modifiers, and defaults. No fields exist in the schema that aren't in the spec, and none in
  the spec are missing from the schema.
- **Relationships modeled correctly.** `OrderItem.order` → `Order` (via `order_id`) and
  `OrderItem.product` → `Product` (via `product_id`) match the spec's `@relation` definitions.
  Prisma requires the back-relation field on the other side of each relation, so
  `Product.order_items OrderItem[]` and `Order.order_items OrderItem[]` were added. The spec's
  table lists `order_items` only on `Order`; the one on `Product` is an implicit requirement of
  Prisma's relation modeling (a virtual field, not a database column), not a deviation from the spec.
- **Cascade rules implemented as documented.** The spec's prose ("When Order or Product is
  deleted, OrderItem should be deleted") is implemented with `onDelete: Cascade` on **both**
  `OrderItem` relations.
- **Clarifying note added.** `OrderItem.price` carries a comment marking it as the price at time
  of purchase (a snapshot set server-side), matching the Transactional Flow's "client's input is
  never trusted for price." Field type (`Float`) was already correct.

### Cascade delete verification
- Deleting a Product removes associated OrderItems: ✅ tested (deleted a product referenced by an
  order item; that OrderItem row was removed, others untouched)
- Deleting an Order removes associated OrderItems: ✅ tested (deleted the order; its remaining
  OrderItems were removed, leaving zero)

# Decisions Log — Order Creation Transaction

- **What my Transactional Flow spec got right**: the step order held up exactly — look up every
  `product_id` (one `findMany`), read each real price from the DB, compute
  `total_price = Σ price × quantity`, then create the Order. Steps 4–5 (create Order, create its
  OrderItems) collapsed into a single nested `prisma.order.create({ data: { ..., order_items: {
  create: [...] } }, include: { order_items: true } })`, so the whole write is one call and the
  response already carries the items.

- **What the spec missed that I discovered during implementation**: the empty-`order_items` case.
  The spec's step 1 mentions rejecting early with 400 if items are empty, but the model's price
  loop / `reduce` assumes a non-empty array, so the guard had to live explicitly in the controller
  (`400 "order_items cannot be empty"`) before the transaction is ever entered. Also reinforced:
  prices are never trusted from the client — they're remapped from the DB product inside the
  transaction, so a tampered client price is simply ignored.

- **How the transaction error handling works**: `prisma.$transaction(async (tx) => {...})` runs
  every `tx.*` operation against one database transaction. If the callback throws — here, a
  `ProductNotFoundError` when a requested `product_id` isn't in the price map — Prisma aborts and
  issues a ROLLBACK, so the Order and any staged OrderItems are never committed (it's
  all-or-nothing). The thrown error then propagates out of `$transaction` to the controller's
  `catch`, which recognizes it (`instanceof ProductNotFoundError`) and returns the contract's
  `400 {"error":"Product not found for product_id: <id>"}`. Verified: a POST with a bad product id
  returned 400 and left the order count unchanged (no partial order).

- **One thing I'd design differently if starting over**: I'd validate each item's shape up front
  (integer `product_id`, `quantity >= 1`) instead of letting bad input reach Prisma, and I'd
  surface *all* missing product ids at once rather than throwing on the first one — collecting the
  full set of invalid ids would give the client a more useful single error instead of a
  fix-one-retry loop. I'd also consider a small error-code enum rather than relying on `instanceof`
  for control flow as the number of domain errors grows.

# Final Spec Reconciliation: Project Complete

Walked one complete user flow — a customer placing an order — front to back:
frontend `handleOnCheckout` (`student-store-ui/src/components/App/App.jsx`) → `POST /orders`
→ `createOrder` (`src/controllers/orderController.js`) → `Order.create` transaction
(`models/order.js`) → `201` response → frontend receipt render.

## Full-system audit result
- **All 10 API-contract endpoints (5 product + 5 order) match the contract** in request shape,
  response shape, and status codes — verified end-to-end (curl + a browser-driven full checkout).
- **`POST /orders` request matches the spec.** The client sends
  `{ customer_id, order_items: [{ product_id, quantity }] }` and omits the optional `status`
  (server defaults it to `"pending"`). It never sends `order_id`, `total_price`, or per-item
  `price` — the server computes each item's `price` from the DB and rolls up `total_price`,
  exactly as the Transactional Flow specifies.
- **The response includes everything the frontend needs.** `201` returns
  `{ order_id, customer_id, total_price, status, created_at, order_items: [{ order_item_id,
  product_id, quantity, price }] }`; the receipt builder reads `order_id`, `total_price`, and the
  `order_items` fields. Nothing the frontend needs is missing.
- **All spec-defined failure states are handled:** empty `order_items` → `400
  "order_items cannot be empty"`; a nonexistent product → `400
  "Product not found for product_id: <id>"` with the whole transaction rolled back (no partial
  order); unexpected failure → global `500`. No reverse gaps were found — every state the spec
  defines is implemented.
- **Behaviors the implementation has that the spec does NOT document** (recorded here, not bugs):
  - `POST /orders` also guards `400 "Missing required field: customer_id"` when `customer_id` is
    absent (controller validation beyond the contract's listed error cases).
  - Each response `order_item` carries an extra `order_id` field (the full Prisma row) beyond the
    contract's documented four fields (`order_item_id, product_id, quantity, price`).
  - The app exposes a root `GET /` welcome route and enables app-wide CORS
    (`app.use(cors())` in `src/server.js`); neither was written into the API Contract. CORS is
    what lets the Vite dev origin (`:5173`) call the API (`:3000`) — recording it here as an
    implementation note so the contract reflects the deployed reality.

## Gaps resolved during frontend integration
- **`customer_id` type.** The checkout form collected no numeric customer field, but the contract
  requires `customer_id: Int`. Resolved on the frontend: derive an integer via
  `parseInt(Student ID)` with a fallback of `1`. Backend/contract unchanged.
- **Receipt response shape.** `CheckoutSuccess` expected `order.purchase.receipt.lines[]`, while
  the contract's `POST /orders` returns a flat order object. Resolved on the frontend by building
  the `purchase.receipt.lines` array from the flat response; the documented backend contract was
  deliberately left intact.
- **Seed tooling** (outside the API contract, surfaced while populating test data): `seed.js` had
  a wrong data path and camelCase field names that didn't match the snake_case Prisma schema.
  Fixed the path and field names so `npm run seed` populates the exact shapes the contract
  documents.

## What the spec enabled during this project
The written contract let the frontend and backend be built and reasoned about independently:
every `fetch` call had an authoritative target shape, so integration became a matter of matching
field names rather than reverse-engineering server behavior — and the two real mismatches
(`customer_id` type and the receipt shape) were caught by reading the spec up front instead of
discovering them as runtime failures during checkout.
