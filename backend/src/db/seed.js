import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcrypt';
import Database from 'better-sqlite3';
import { demoAccount, env } from '../config/env.js';

const schema = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');

const products = [
  {
    name: 'Narrow-Spout Kettle, 1.0 L',
    description:
      'A 1.0 L stovetop kettle with a restricted spout for slow, circular pours. The handle stays clear of the steam path, and the lid is capped so it does not rattle when the water is just off the boil. Interior volume marks run from 200 ml to 1.0 L. It sits flat on gas and electric coils.',
    variants: [
      { label: 'Matte black', sku: 'CG-KETTLE-BLK', priceCents: 6800, stock: 14 },
      { label: 'Brushed steel', sku: 'CG-KETTLE-STL', priceCents: 6800, stock: 9 },
    ],
  },
  {
    name: 'Counter Burr Grinder',
    description:
      'A conical burr grinder meant to live on the counter, not in a cupboard. Forty stepped settings cover espresso through French press, and the grounds bin holds 80 g. The hopper takes about 250 g of beans. The walnut model uses the same burr set with a solid wood collar around the top.',
    variants: [
      { label: 'Black', sku: 'CG-GRIND-BLK', priceCents: 18900, stock: 6 },
      { label: 'White', sku: 'CG-GRIND-WHT', priceCents: 18900, stock: 4 },
      { label: 'Walnut', sku: 'CG-GRIND-WAL', priceCents: 21000, stock: 3 },
    ],
  },
  {
    name: 'Ceramic Cone Dripper',
    description:
      'A glazed ceramic cone with spiral ribs that keep the paper off the wall. Size 01 is for one to two cups. Size 02 is for two to four. The base fits a mug, a server, or a narrow-neck carafe. It is dishwasher safe. The glaze holds heat, so a short preheat with brew water is worth doing.',
    variants: [
      { label: 'Size 01', sku: 'CG-DRIP-01', priceCents: 2800, stock: 22 },
      { label: 'Size 02', sku: 'CG-DRIP-02', priceCents: 3200, stock: 18 },
    ],
  },
  {
    name: 'Double-Wall Glass Server',
    description:
      'A 600 ml borosilicate server with a double wall, so the handle side stays comfortable while the coffee stays hot. The neck is narrow enough to swirl when you want to check the bloom. Volume marks are printed at 200, 400, and 600 ml. It pours from a pulled lip rather than a separate spout.',
    variants: [{ label: '600 ml', sku: 'CG-SERVER-600', priceCents: 3600, stock: 15 }],
  },
  {
    name: 'Brew Scale',
    description:
      'A compact scale with 0.1 g resolution and a count-up timer that starts when weight first lands on the platform. The deck fits a 1 L press, or a dripper sitting on a mug. It switches off after five minutes of stillness and runs on two AAA batteries, which are included. Maximum load is 2 kg.',
    variants: [{ label: '0.1 g', sku: 'CG-SCALE', priceCents: 5400, stock: 11 }],
  },
  {
    name: 'Unbleached Cone Filters',
    description:
      'One hundred unbleached paper cones for a size 02 dripper. The paper is creped so it seats without a long fuss, though a short rinse still takes the paper taste out of the first cup. They ship folded flat in a tuck box. A size 01 dripper is too small for this pack.',
    variants: [{ label: 'Size 02, 100 count', sku: 'CG-FILTER-02', priceCents: 900, stock: 40 }],
  },
  {
    name: 'Flat Base Tamper',
    description:
      'A 58 mm flat-base tamper in 304 stainless, with a slight bevel so the edge does not scrape the basket wall. The handle is turned aluminum, 90 mm long, with a flat top you can push from the heel of your hand. It fits a standard 58 mm portafilter basket. It is the wrong diameter for 54 mm and 51 mm baskets.',
    variants: [{ label: '58 mm', sku: 'CG-TAMPER-58', priceCents: 4200, stock: 8 }],
  },
  {
    name: 'Milk Pitcher',
    description:
      'A 350 ml stainless pitcher with a sharp spout and a wider side for a two-finger grip. The wall is thin enough that you can judge heat by hand once you have pulled a few drinks. Interior marks sit at 150 ml and 250 ml. This size is for one or two drinks, not a large latte plus extra foam.',
    variants: [{ label: '350 ml', sku: 'CG-PITCHER-350', priceCents: 2400, stock: 20 }],
  },
  {
    name: 'Borosilicate French Press',
    description:
      'A borosilicate carafe in a stainless frame, with a four-plate filter stack. The plunger rod is centered so the mesh does not tilt and let silt through. The lid locks in two positions: closed while the coffee steeps, and a quarter turn open for pouring. The three sizes share the same frame pattern, scaled up.',
    variants: [
      { label: '350 ml', sku: 'CG-PRESS-350', priceCents: 3200, stock: 10 },
      { label: '800 ml', sku: 'CG-PRESS-800', priceCents: 4200, stock: 7 },
      { label: '1 L', sku: 'CG-PRESS-1000', priceCents: 4800, stock: 5 },
    ],
  },
  {
    name: 'Immersion Pressure Brewer',
    description:
      'A chamber-and-plunger brewer that makes about 250 ml at a time. Grounds steep in the chamber, then the press pushes the coffee through a paper disc. The body stays cool enough to hold right after brewing. Twenty filters are in the box, and the cap seals well enough for a short commute in a bag.',
    variants: [{ label: 'Standard', sku: 'CG-BREWER', priceCents: 3900, stock: 16 }],
  },
  {
    name: 'Cold Brew Bottle',
    description:
      'A 1 L glass bottle with a stainless filter plunger for steeping grounds in cold water. A typical batch is 80 g of coarse coffee and 800 ml of water, left in the fridge for 14 to 16 hours. The lid is watertight for pouring. The glass is thick, but do not freeze a full bottle.',
    variants: [{ label: '1 L', sku: 'CG-COLD-1000', priceCents: 2800, stock: 13 }],
  },
  {
    name: 'Thick-Wall Espresso Cups',
    description:
      'Two 80 ml cups in heavy porcelain, with a foot wide enough that they do not skate across a steel counter. The wall holds heat so a short espresso does not go cold before you finish it. The glaze is an off-white with a light speckle. They stack, and they are dishwasher safe.',
    variants: [{ label: 'Set of 2', sku: 'CG-CUPS-2', priceCents: 2200, stock: 19 }],
  },
  {
    name: 'Valve Coffee Canister',
    description:
      'A stainless canister that holds about 500 g of whole bean coffee. The lid has a one-way silicone valve and a rubber gasket, so you can press extra air out after each scoop. The body is opaque. A ring on the lid is marked in days, for the roast date, rather than a digital counter.',
    variants: [{ label: '500 g', sku: 'CG-CAN-500', priceCents: 3400, stock: 12 }],
  },
  {
    name: 'Portable Hand Grinder',
    description:
      'A hand grinder with a folding crank and a catch cup that threads on tight. The steel burr model is the everyday version. The coated burr model uses the same body with a harder burr set that holds an edge longer if you grind for espresso every morning. Both adjust from the top collar. The unit is 195 mm tall and fits a daypack side pocket.',
    variants: [
      { label: 'Steel burr', sku: 'CG-HAND-STL', priceCents: 7800, stock: 9 },
      { label: 'Coated burr', sku: 'CG-HAND-COAT', priceCents: 11800, stock: 4 },
    ],
  },
  {
    name: 'Vacuum Travel Mug',
    description:
      'A 355 ml vacuum mug with a ceramic-coated interior and a lid that opens with a quarter turn. It keeps coffee hot for about four hours in a 20 C office, and for less time if it sits in a cold car. The base fits a standard car cup holder. Rinse the lid seal by hand. It is not a dishwasher piece.',
    variants: [
      { label: 'Slate', sku: 'CG-MUG-SLA', priceCents: 2600, stock: 15 },
      { label: 'Sand', sku: 'CG-MUG-SAN', priceCents: 2600, stock: 12 },
      { label: 'Forest', sku: 'CG-MUG-FOR', priceCents: 2600, stock: 8 },
    ],
  },
];

fs.mkdirSync(path.dirname(env.databasePath), { recursive: true });
if (fs.existsSync(env.databasePath)) {
  fs.unlinkSync(env.databasePath);
}

const db = new Database(env.databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');
db.pragma('busy_timeout = 5000');
db.exec(schema);

const insertUser = db.prepare(
  'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
);
const insertProduct = db.prepare('INSERT INTO products (name, description) VALUES (?, ?)');
const insertVariant = db.prepare(
  `INSERT INTO product_variants (product_id, label, sku, price_cents, stock_quantity)
   VALUES (?, ?, ?, ?, ?)`
);

const passwordHash = bcrypt.hashSync(demoAccount.password, 10);

const seed = db.transaction(() => {
  insertUser.run(demoAccount.email, passwordHash, demoAccount.name);
  for (const product of products) {
    const created = insertProduct.run(product.name, product.description);
    for (const variant of product.variants) {
      insertVariant.run(
        created.lastInsertRowid,
        variant.label,
        variant.sku,
        variant.priceCents,
        variant.stock
      );
    }
  }
});

seed();

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .all()
  .map((row) => row.name);
db.close();

const variantCount = products.reduce((sum, product) => sum + product.variants.length, 0);
const rows = [
  ['Database', env.databasePath],
  ['Tables', tables.join(', ')],
  ['Products', String(products.length)],
  ['Variants', String(variantCount)],
  ['Email', demoAccount.email],
  ['Password', demoAccount.password],
];
const labelWidth = Math.max(...rows.map((row) => row[0].length));
console.log('Copper & Grain seed');
for (const [label, value] of rows) {
  console.log(`${label.padEnd(labelWidth)}  ${value}`);
}
