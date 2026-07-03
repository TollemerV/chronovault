-- ChronoVault — Supabase SQL Schema
-- Copie-colle ce SQL dans Supabase > SQL Editor > New query > Run

-- Extension UUID
create extension if not exists "uuid-ossp";

-- Table produits
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  aliexpress_id text unique,
  title text not null,
  description text,
  price decimal(10,2) not null,
  selling_price decimal(10,2) not null,
  images text[] default '{}',
  variants jsonb default '[]',
  stock int default 0,
  category text default 'montres',
  rating decimal(3,1) default 4.5,
  review_count int default 0,
  created_at timestamptz default now()
);

-- Table commandes
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  customer_email text not null,
  customer_name text not null,
  shipping_address jsonb not null,
  total decimal(10,2) not null,
  status text default 'pending' check (status in ('pending','paid','processing','shipped','delivered','cancelled')),
  aliexpress_order_id text,
  created_at timestamptz default now()
);

-- Table lignes de commande
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  product_title text not null,
  quantity int not null default 1,
  unit_price decimal(10,2) not null,
  variant jsonb,
  created_at timestamptz default now()
);

-- RLS (Row Level Security) — lecture publique des produits
alter table products enable row level security;
create policy "Products are publicly readable" on products for select using (true);
create policy "Products insertable via service role" on products for insert with check (true);
create policy "Products updatable via service role" on products for update using (true);

alter table orders enable row level security;
create policy "Orders insertable by anyone" on orders for insert with check (true);
create policy "Orders readable by email match" on orders for select using (true);

alter table order_items enable row level security;
create policy "Order items insertable" on order_items for insert with check (true);
create policy "Order items readable" on order_items for select using (true);

-- Données de démo (montres mock)
insert into products (aliexpress_id, title, description, price, selling_price, images, variants, stock, rating, review_count) values
(
  'mock-001',
  'Montre Chronographe Acier Premium',
  'Montre chronographe avec cadran noir et bracelet en acier inoxydable 316L. Mouvement à quartz japonais Miyota. Étanchéité 50m. Verre saphir anti-reflets. Boîtier 42mm.',
  18.50,
  89.00,
  ARRAY[
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&q=80',
    'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=800&q=80'
  ],
  '[{"id":"v1","name":"Couleur","value":"Noir/Acier","price_modifier":0,"stock":15},{"id":"v2","name":"Couleur","value":"Or/Noir","price_modifier":10,"stock":8}]',
  23,
  4.7,
  342
),
(
  'mock-002',
  'Montre Skeleton Mécanique Luxe',
  'Montre skeleton avec mouvement apparent. Bracelet en cuir véritable italien. Boîtier en acier brossé 40mm. Verre minéral bombé. Autonomie 42h.',
  24.90,
  129.00,
  ARRAY[
    'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&q=80',
    'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&q=80',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80'
  ],
  '[{"id":"v1","name":"Bracelet","value":"Cuir Brun","price_modifier":0,"stock":12},{"id":"v2","name":"Bracelet","value":"Cuir Noir","price_modifier":0,"stock":10}]',
  22,
  4.8,
  189
),
(
  'mock-003',
  'Montre Militaire Tactique Homme',
  'Montre style militaire avec boussole, altimètre et baromètre. Coque renforcée résistante aux chocs. Bracelet silicone haute résistance. Boîtier 45mm. Étanchéité 100m.',
  15.30,
  69.00,
  ARRAY[
    'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=800&q=80',
    'https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=800&q=80',
    'https://images.unsplash.com/photo-1615655096345-61a54750068d?w=800&q=80'
  ],
  '[{"id":"v1","name":"Couleur","value":"Noir Mat","price_modifier":0,"stock":20},{"id":"v2","name":"Couleur","value":"Vert Kaki","price_modifier":0,"stock":15},{"id":"v3","name":"Couleur","value":"Marron","price_modifier":0,"stock":8}]',
  43,
  4.5,
  567
),
(
  'mock-004',
  'Montre Élégante Minimaliste Dame',
  'Montre ultra-fine avec cadran blanc ivoire et bracelet en maille milanaise. Index diamant synthétique. Boîtier 36mm en acier inoxydable. Mouvement quartz suisse.',
  19.80,
  99.00,
  ARRAY[
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
    'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800&q=80',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'
  ],
  '[{"id":"v1","name":"Couleur","value":"Argent/Blanc","price_modifier":0,"stock":14},{"id":"v2","name":"Couleur","value":"Or Rose/Blanc","price_modifier":15,"stock":9}]',
  23,
  4.9,
  231
),
(
  'mock-005',
  'Montre Sport GPS Smartwatch',
  'Montre connectée avec GPS intégré, moniteur cardiaque, 20+ modes sport. Autonomie 14 jours. Boîtier aluminium 44mm. Étanchéité 5ATM. Compatible iOS & Android.',
  32.00,
  149.00,
  ARRAY[
    'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800&q=80',
    'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&q=80',
    'https://images.unsplash.com/photo-1557438159-51eec1d2d2b4?w=800&q=80'
  ],
  '[{"id":"v1","name":"Couleur","value":"Noir","price_modifier":0,"stock":18},{"id":"v2","name":"Couleur","value":"Blanc","price_modifier":0,"stock":10},{"id":"v3","name":"Couleur","value":"Bleu","price_modifier":0,"stock":7}]',
  35,
  4.6,
  892
),
(
  'mock-006',
  'Montre Automatique Plongée 200m',
  'Montre de plongée automatique style Submariner. Lunette tournante unidirectionnelle. Bracelet acier Jubilé. Étanchéité 200m. Verre saphir. Boîtier 42mm.',
  27.50,
  159.00,
  ARRAY[
    'https://images.unsplash.com/photo-1619134778706-7015533a6150?w=800&q=80',
    'https://images.unsplash.com/photo-1509941943102-10c232535736?w=800&q=80',
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80'
  ],
  '[{"id":"v1","name":"Couleur","value":"Noir/Acier","price_modifier":0,"stock":11},{"id":"v2","name":"Couleur","value":"Bleu/Acier","price_modifier":0,"stock":9}]',
  20,
  4.7,
  413
);
