create extension if not exists pgcrypto;

create table if not exists public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  product_id text not null unique,
  name text not null,
  brand text not null,
  category text not null,
  weight text,
  rarity text default 'common',
  icon text not null,
  image text not null,
  purchase_link text,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.catalog_products enable row level security;

drop policy if exists "Authenticated users can read catalog products" on public.catalog_products;
create policy "Authenticated users can read catalog products"
on public.catalog_products
for select
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('catalog-product-images', 'catalog-product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view catalog product images" on storage.objects;
create policy "Public can view catalog product images"
on storage.objects
for select
to public
using (bucket_id = 'catalog-product-images');

insert into public.catalog_products (
  product_id,
  name,
  brand,
  category,
  weight,
  rarity,
  icon,
  image,
  purchase_link,
  notes
)
values
  (
    'buff-original-ecostretch',
    'Original EcoStretch',
    'Buff',
    'headwear',
    '40 g',
    'common',
    'BE',
    'https://www.buff.com/media/catalog/product/6/a/6ab3eb39df6c5415_117818_999_2025-03-31t15-21-27z.jpg',
    'https://www.buff.com/us/original-ecostretch-neckwear-buff-solid-black-black-117818999.html',
    'Versatile neckwear for sun, wind, and cool evenings.'
  ),
  (
    'icebreaker-tech-lite-tee',
    'Merino 150 Tech Lite Short Sleeve Tee',
    'Icebreaker',
    'base-layer',
    '150 g',
    'rare',
    'IT',
    'https://na.icebreaker.com/dw/image/v2/BGMD_PRD/on/demandware.static/-/Sites-master-catalog/default/dwd93cc48a/images/large/0A56WL_0L1_MAIN.jpg',
    'https://na.icebreaker.com/en-us/products/men-merino-150-tech-lite-ss-tee-ib0a56wl0l1',
    'Light merino tee for daily hiking and layering.'
  ),
  (
    'rab-xenair-alpine-light',
    'Xenair Alpine Light Insulated Jacket',
    'Rab',
    'mid-layer',
    '380 g',
    'rare',
    'RX',
    'https://rab.equipment/media/catalog/product/x/e/xenair_alpine_light_jacket_black_qip_17_blk_1.jpg',
    'https://rab.equipment/us/mens-xenair-alpine-light-insulated-jacket',
    'Breathable active insulation for cool camps and moving fast.'
  ),
  (
    'patagonia-houdini-jacket',
    'Houdini Jacket',
    'Patagonia',
    'shell',
    '105 g',
    'rare',
    'PH',
    'https://www.rei.com/media/d767ba00-0dd4-4412-851e-a24d93676fca.jpg?size=784x588',
    'https://www.rei.com/product/C09417/patagonia-houdini-jacket-mens',
    'Very packable wind shell for unsettled weather.'
  ),
  (
    'outdoor-research-ferrosi-pants',
    'Ferrosi Pants',
    'Outdoor Research',
    'pants',
    '290 g',
    'common',
    'FP',
    'https://www.rei.com/media/d4738700-543a-4648-b320-458e50131e26.jpg?size=784x588',
    'https://www.rei.com/product/154696/outdoor-research-ferrosi-pants-mens',
    'Stretch hiking pants with strong trail durability.'
  ),
  (
    'darn-tough-atc-micro-crew',
    'ATC Micro Crew Midweight Hiking Socks',
    'Darn Tough',
    'footwear',
    '77 g',
    'common',
    'DT',
    'https://darntough.com/cdn/shop/files/1956_Pine.png?v=1767362913',
    'https://darntough.com/products/unisex-merino-wool-atc-micro-crew-cushioned-midweight-hiking-socks',
    'Cushioned merino hiking socks for long days on foot.'
  ),
  (
    'osprey-exos-38',
    'Exos 38',
    'Osprey',
    'backpack',
    '1.28 kg',
    'epic',
    'OE',
    'https://www.osprey.com/gb/media/catalog/product/cache/cf9bfa9b71b0c213f1d92bcd5e9e941f/e/x/exos38_s25_side_darkcharcoal_2.jpg',
    'https://www.osprey.com/gb/osprey-exos-38-s25',
    'Light framed backpack sized for fast overnights.'
  ),
  (
    'nemo-tensor-trail-ultralight',
    'Tensor Trail Ultralight Insulated Sleeping Pad',
    'NEMO',
    'sleep',
    '398 g',
    'rare',
    'NT',
    'https://www.nemoequipment.com/cdn/shop/files/izwrkazwjdyxroajlsej.png?v=1761683391',
    'https://www.nemoequipment.com/collections/car-camping-pads/products/tensor-trail-insulated-ultralight-sleeping-pad',
    'Insulated inflatable pad for compact sleep systems.'
  ),
  (
    'big-agnes-copper-spur-hv-ul2',
    'Copper Spur HV UL2',
    'Big Agnes',
    'shelter',
    '1.42 kg',
    'epic',
    'BA',
    'https://eu.bigagnes.com/cdn/shop/files/CopperAW1_1x.png?v=1720731363',
    'https://eu.bigagnes.com/products/copper-spur-hv-ul2',
    'Freestanding two-person shelter with strong weight-to-space ratio.'
  ),
  (
    'msr-pocketrocket-deluxe-stove-kit',
    'PocketRocket Deluxe Stove Kit',
    'MSR',
    'cook',
    '390 g',
    'rare',
    'MS',
    'https://www.msrgear.com/media/catalog/product/cache/837066f95d0fa3299dd1f17f9a85e679/1/1/11009_pocketrocket_deluxe_stove_kit_1_5l_hn_1.jpg',
    'https://cascadedesigns.com/products/pocketrocket-deluxe-stove-kit',
    'Compact canister stove cook kit for simple trail meals.'
  )
on conflict (product_id) do update set
  name = excluded.name,
  brand = excluded.brand,
  category = excluded.category,
  weight = excluded.weight,
  rarity = excluded.rarity,
  icon = excluded.icon,
  image = excluded.image,
  purchase_link = excluded.purchase_link,
  notes = excluded.notes;
