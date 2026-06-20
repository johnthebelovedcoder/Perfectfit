import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ---------------------------------------------------------------------------
// Curated Unsplash clothing photos — real clothing only, multiple angles
// ---------------------------------------------------------------------------
const PHOTOS = {
  // Women's Tops
  silk_blouse: [
    "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80",
    "https://images.unsplash.com/photo-1594938298603-c8148c4a8e5f?w=800&q=80",
    "https://images.unsplash.com/photo-1608234807905-4466023792f5?w=800&q=80",
  ],
  white_tee: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=80",
    "https://images.unsplash.com/photo-1503342564405-6b2ce27b5a73?w=800&q=80",
  ],
  crop_top: [
    "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=800&q=80",
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
  ],
  stripe_shirt: [
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
    "https://images.unsplash.com/photo-1611042553484-d61f84d22784?w=800&q=80",
    "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80",
  ],
  // Men's Tops
  polo_shirt: [
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
    "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  ],
  hoodie: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
  ],
  // Bottoms
  blue_jeans: [
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80",
    "https://images.unsplash.com/photo-1542219550-37153d387c27?w=800&q=80",
    "https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&q=80",
  ],
  khaki_pants: [
    "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80",
    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80",
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80",
  ],
  mini_skirt: [
    "https://images.unsplash.com/photo-1614251056798-0a63eda2bb25?w=800&q=80",
    "https://images.unsplash.com/photo-1590548784585-643d2b9f2925?w=800&q=80",
    "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=800&q=80",
  ],
  // Dresses
  floral_dress: [
    "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
    "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&q=80",
  ],
  red_dress: [
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80",
  ],
  black_dress: [
    "https://images.unsplash.com/photo-1476234251651-f353703a034d?w=800&q=80",
    "https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=800&q=80",
    "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&q=80",
  ],
  midi_dress: [
    "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=800&q=80",
    "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
  ],
  // Outerwear
  denim_jacket: [
    "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800&q=80",
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
  ],
  blazer: [
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800&q=80",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80",
  ],
  leather_jacket: [
    "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80",
    "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800&q=80",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
  ],
  trench_coat: [
    "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800&q=80",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80",
    "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800&q=80",
  ],
  // Shoes
  white_sneakers: [
    "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80",
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
  ],
  running_shoes: [
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
  ],
  heels: [
    "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=80",
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80",
    "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=800&q=80",
  ],
  loafers: [
    "https://images.unsplash.com/photo-1614253429340-98120bd6d753?w=800&q=80",
    "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80",
    "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80",
  ],
  // Bags
  leather_bag: [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
    "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80",
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
  ],
  pink_bag: [
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
    "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80",
  ],
  tote_bag: [
    "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80",
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
  ],
  // Accessories
  sunglasses: [
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80",
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
    "https://images.unsplash.com/photo-1473496169904-658ba7574b0d?w=800&q=80",
  ],
  watch: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80",
    "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800&q=80",
  ],
  hat: [
    "https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?w=800&q=80",
    "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&q=80",
    "https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=800&q=80",
  ],
};

function slug(title: string, index: number) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + index;
}

// Prices in cents (USD)
const ITEMS: Array<{
  title: string;
  description: string;
  category: string;
  itemType: string;
  brand: string | null;
  size: string;
  genderTarget: string;
  condition: string;
  retailPrice: number; // cents USD
  payoutPrice: number; // cents USD
  photos: string[];
}> = [
  // ── TOPS — Women ───────────────────────────────────────────────────────────
  {
    title: "Vintage Silk Floral Blouse",
    description: "Beautiful vintage silk blouse with a delicate floral print. Light and breezy — perfect for layering or wearing alone. Minor wear on collar only, barely noticeable.",
    category: "ANKARA_OUTFITS", itemType: "Blouse", brand: "Zara", size: "M", genderTarget: "WOMEN",
    condition: "EXCELLENT", retailPrice: 3200, payoutPrice: 1600, photos: PHOTOS.silk_blouse,
  },
  {
    title: "Oversized Ribbed Knit Sweater",
    description: "Cozy off-white oversized ribbed knit. Slightly cropped. Worn a handful of times, washed gently. No pilling or snags.",
    category: "ANKARA_OUTFITS", itemType: "Sweater", brand: "H&M", size: "L", genderTarget: "WOMEN",
    condition: "EXCELLENT", retailPrice: 2800, payoutPrice: 1400, photos: PHOTOS.white_tee,
  },
  {
    title: "Black Corset Crop Top",
    description: "Structured satin corset crop top with boning channels. Great for evening events or styled over a shirt. UK size 12.",
    category: "ANKARA_OUTFITS", itemType: "Crop Top", brand: null, size: "12", genderTarget: "WOMEN",
    condition: "GOOD", retailPrice: 2500, payoutPrice: 1100, photos: PHOTOS.crop_top,
  },
  {
    title: "White Broderie Anglaise Blouse",
    description: "Classic white broderie anglaise blouse. Timeless, pairs with anything. Light pilling under arms from regular wear.",
    category: "ANKARA_OUTFITS", itemType: "Blouse", brand: "Marks & Spencer", size: "S", genderTarget: "WOMEN",
    condition: "GOOD", retailPrice: 1900, payoutPrice: 900, photos: PHOTOS.silk_blouse,
  },
  {
    title: "Striped Linen Button-Down Shirt",
    description: "Relaxed navy and white striped linen shirt. Great for warm weather. No stains, no damage. Barely worn.",
    category: "ANKARA_OUTFITS", itemType: "Button-Down", brand: "Everlane", size: "S", genderTarget: "WOMEN",
    condition: "EXCELLENT", retailPrice: 3500, payoutPrice: 1800, photos: PHOTOS.stripe_shirt,
  },
  // ── TOPS — Men ─────────────────────────────────────────────────────────────
  {
    title: "Ralph Lauren Polo Shirt Navy",
    description: "Classic navy Ralph Lauren polo. Authentic, purchased in New York. Minor fade from machine washing — still great condition.",
    category: "ANKARA_OUTFITS", itemType: "Polo Shirt", brand: "Ralph Lauren", size: "L", genderTarget: "MEN",
    condition: "GOOD", retailPrice: 4500, payoutPrice: 2200, photos: PHOTOS.polo_shirt,
  },
  {
    title: "Vintage Champion Hoodie Gray",
    description: "Authentic vintage Champion reverse-weave hoodie. Thick, heavyweight fleece. Small fading on logo — adds character. Size L.",
    category: "ANKARA_OUTFITS", itemType: "Hoodie", brand: "Champion", size: "L", genderTarget: "MEN",
    condition: "GOOD", retailPrice: 5500, payoutPrice: 2700, photos: PHOTOS.hoodie,
  },
  {
    title: "Oxford Blue Stripe Dress Shirt",
    description: "Blue and white striped Oxford dress shirt. Formal or smart-casual. Small pen mark on inside pocket only.",
    category: "ANKARA_OUTFITS", itemType: "Dress Shirt", brand: "Brooks Brothers", size: "M", genderTarget: "MEN",
    condition: "GOOD", retailPrice: 3800, payoutPrice: 1800, photos: PHOTOS.stripe_shirt,
  },
  {
    title: "Graphic Oversized Tee — Abstract",
    description: "Cool oversized graphic tee with abstract art print. 100% cotton. Washed gently — print fully intact.",
    category: "ANKARA_OUTFITS", itemType: "T-Shirt", brand: "ASOS", size: "L", genderTarget: "MEN",
    condition: "GOOD", retailPrice: 1800, payoutPrice: 800, photos: PHOTOS.white_tee,
  },
  {
    title: "Brand New Linen Resort Shirt",
    description: "Deadstock linen short-sleeve resort shirt in a subtle sage-and-white check. Never worn, original tags intact.",
    category: "ANKARA_OUTFITS", itemType: "Resort Shirt", brand: "J.Crew", size: "M", genderTarget: "MEN",
    condition: "BRAND_NEW", retailPrice: 5200, payoutPrice: 2600, photos: PHOTOS.stripe_shirt,
  },
  // ── BOTTOMS — Women ────────────────────────────────────────────────────────
  {
    title: "High-Rise Straight Leg Jeans",
    description: "Classic high-rise straight leg blue denim. Slight stretch. Very comfortable. Light fading at knees from wear.",
    category: "SKIRTS_BLOUSES", itemType: "Jeans", brand: "Levi's", size: "28", genderTarget: "WOMEN",
    condition: "GOOD", retailPrice: 4800, payoutPrice: 2400, photos: PHOTOS.blue_jeans,
  },
  {
    title: "Pleated Camel Midi Skirt",
    description: "Elegant camel pleated midi skirt. Polyester blend, sits at natural waist. Worn twice. No damage.",
    category: "SKIRTS_BLOUSES", itemType: "Midi Skirt", brand: "Zara", size: "S", genderTarget: "WOMEN",
    condition: "EXCELLENT", retailPrice: 3600, payoutPrice: 1800, photos: PHOTOS.mini_skirt,
  },
  {
    title: "Wide-Leg Cream Palazzo Pants",
    description: "Flowy wide-leg palazzo trousers in cream. Perfect for the office or events. Worn 3 times — immaculate.",
    category: "SKIRTS_BLOUSES", itemType: "Trousers", brand: "H&M", size: "M", genderTarget: "WOMEN",
    condition: "EXCELLENT", retailPrice: 3200, payoutPrice: 1600, photos: PHOTOS.khaki_pants,
  },
  {
    title: "Faux Leather Black Mini Skirt",
    description: "Trendy faux leather mini skirt. Edgy and fun. Small scuff on back hem, barely visible.",
    category: "SKIRTS_BLOUSES", itemType: "Mini Skirt", brand: "Boohoo", size: "10", genderTarget: "WOMEN",
    condition: "GOOD", retailPrice: 2200, payoutPrice: 1000, photos: PHOTOS.mini_skirt,
  },
  // ── BOTTOMS — Men ──────────────────────────────────────────────────────────
  {
    title: "Slim Fit Khaki Chinos",
    description: "Smart slim-fit khaki chinos. Great for smart-casual occasions. Minor fraying at one pocket lining.",
    category: "SKIRTS_BLOUSES", itemType: "Chinos", brand: "Gap", size: "32x30", genderTarget: "MEN",
    condition: "GOOD", retailPrice: 3500, payoutPrice: 1700, photos: PHOTOS.khaki_pants,
  },
  {
    title: "Black Tailored Suit Trousers",
    description: "Classic black tailored trousers. Can be paired with a matching jacket. Recently dry cleaned.",
    category: "SKIRTS_BLOUSES", itemType: "Suit Trousers", brand: "Ted Baker", size: "34", genderTarget: "MEN",
    condition: "EXCELLENT", retailPrice: 5500, payoutPrice: 2700, photos: PHOTOS.khaki_pants,
  },
  {
    title: "Raw Hem Selvedge Denim Jeans",
    description: "Japanese selvedge denim with raw hem. Medium wash, slim straight fit. Worn about 10 times — broken in perfectly.",
    category: "SKIRTS_BLOUSES", itemType: "Jeans", brand: "Uniqlo", size: "32", genderTarget: "MEN",
    condition: "GOOD", retailPrice: 5800, payoutPrice: 2900, photos: PHOTOS.blue_jeans,
  },
  // ── DRESSES ────────────────────────────────────────────────────────────────
  {
    title: "Off-Shoulder Red Bodycon Dress",
    description: "Stunning red off-shoulder bodycon dress. Knee length, figure-hugging fit. Worn once to a birthday party.",
    category: "DRESSES_GOWNS", itemType: "Bodycon Dress", brand: "Fashion Nova", size: "M", genderTarget: "WOMEN",
    condition: "EXCELLENT", retailPrice: 4200, payoutPrice: 2100, photos: PHOTOS.red_dress,
  },
  {
    title: "Yellow Floral Maxi Dress",
    description: "Bright yellow floral maxi dress. Boho-style with adjustable straps and tiered skirt. Light colour transfer on side seam (barely visible).",
    category: "DRESSES_GOWNS", itemType: "Maxi Dress", brand: "ASOS", size: "12", genderTarget: "WOMEN",
    condition: "GOOD", retailPrice: 3800, payoutPrice: 1800, photos: PHOTOS.floral_dress,
  },
  {
    title: "Sage Green Wrap Midi Dress",
    description: "Soft sage green wrap midi dress. Flattering ruched bodice. Never worn — tags removed but brand new condition.",
    category: "DRESSES_GOWNS", itemType: "Wrap Dress", brand: "Zara", size: "M", genderTarget: "WOMEN",
    condition: "EXCELLENT", retailPrice: 5500, payoutPrice: 2700, photos: PHOTOS.midi_dress,
  },
  {
    title: "Little Black Cocktail Dress",
    description: "Elegant black cocktail dress with asymmetric hem and subtle sequin detail. Great for evening events. Minor sequin loss at hemline.",
    category: "DRESSES_GOWNS", itemType: "Cocktail Dress", brand: "River Island", size: "10", genderTarget: "WOMEN",
    condition: "GOOD", retailPrice: 4800, payoutPrice: 2300, photos: PHOTOS.black_dress,
  },
  {
    title: "Brand New Floral Sundress",
    description: "Brand new floral sundress with smocked bodice and tiered skirt. Never worn. Perfect for summer. Original tags attached.",
    category: "DRESSES_GOWNS", itemType: "Sundress", brand: "Reformation", size: "S", genderTarget: "WOMEN",
    condition: "BRAND_NEW", retailPrice: 8500, payoutPrice: 4200, photos: PHOTOS.floral_dress,
  },
  {
    title: "Stripe Cotton Shirt Dress",
    description: "Classic navy stripe cotton shirt dress. Belted waist, knee length. Casual and versatile. Belt loops — belt not included.",
    category: "DRESSES_GOWNS", itemType: "Shirt Dress", brand: "Banana Republic", size: "S", genderTarget: "WOMEN",
    condition: "GOOD", retailPrice: 4500, payoutPrice: 2200, photos: PHOTOS.floral_dress,
  },
  // ── OUTERWEAR ──────────────────────────────────────────────────────────────
  {
    title: "Classic Beige Trench Coat",
    description: "Timeless double-breasted trench coat in camel beige. Belted. Dry cleaned. Light mark on inner lining.",
    category: "LACE_OUTFITS", itemType: "Trench Coat", brand: "Burberry", size: "M", genderTarget: "WOMEN",
    condition: "GOOD", retailPrice: 18500, payoutPrice: 9200, photos: PHOTOS.trench_coat,
  },
  {
    title: "Faux Leather Biker Jacket Black",
    description: "Classic black faux leather biker jacket. Zip pockets and studded collar. Light surface cracking on sleeves.",
    category: "LACE_OUTFITS", itemType: "Biker Jacket", brand: "River Island", size: "10", genderTarget: "WOMEN",
    condition: "GOOD", retailPrice: 6500, payoutPrice: 3200, photos: PHOTOS.leather_jacket,
  },
  {
    title: "Oversized Camel Blazer",
    description: "Trendy oversized camel blazer. Can be worn as a jacket or draped over shoulders. No damage — excellent condition.",
    category: "LACE_OUTFITS", itemType: "Blazer", brand: "H&M", size: "L", genderTarget: "WOMEN",
    condition: "EXCELLENT", retailPrice: 5800, payoutPrice: 2900, photos: PHOTOS.blazer,
  },
  {
    title: "Men's Navy Wool Overcoat",
    description: "Smart navy wool-blend overcoat. Single-breasted. Dry cleaned. Small moth hole on inner lining.",
    category: "LACE_OUTFITS", itemType: "Overcoat", brand: "Topman", size: "L", genderTarget: "MEN",
    condition: "GOOD", retailPrice: 9500, payoutPrice: 4700, photos: PHOTOS.blazer,
  },
  {
    title: "Oversized Denim Jacket",
    description: "Classic oversized denim jacket. Light wash with subtle distressing. Unisex sizing — fits most M/L.",
    category: "LACE_OUTFITS", itemType: "Denim Jacket", brand: "Levi's", size: "L", genderTarget: "UNISEX",
    condition: "GOOD", retailPrice: 7200, payoutPrice: 3600, photos: PHOTOS.denim_jacket,
  },
  {
    title: "Brand New Wool-Blend Blazer",
    description: "Brand new charcoal wool-blend double-breasted blazer. Never worn. Original tags attached. Tailored fit.",
    category: "LACE_OUTFITS", itemType: "Blazer", brand: "Calvin Klein", size: "40R", genderTarget: "MEN",
    condition: "BRAND_NEW", retailPrice: 12500, payoutPrice: 6200, photos: PHOTOS.blazer,
  },
  // ── SHOES ──────────────────────────────────────────────────────────────────
  {
    title: "New Balance 550 White",
    description: "Iconic New Balance 550 in white/grey. Worn about 5 times. Clean — no yellowing, no scuffs. Size US 8W.",
    category: "SHOES_BAGS", itemType: "Sneakers", brand: "New Balance", size: "US 8", genderTarget: "WOMEN",
    condition: "EXCELLENT", retailPrice: 9500, payoutPrice: 4700, photos: PHOTOS.white_sneakers,
  },
  {
    title: "Nike Air Max 270 React",
    description: "Nike Air Max 270 React in black and anthracite. Cushioned sole. Used regularly — soles show wear but uppers are clean. US 10.",
    category: "SHOES_BAGS", itemType: "Sneakers", brand: "Nike", size: "US 10", genderTarget: "MEN",
    condition: "GOOD", retailPrice: 7500, payoutPrice: 3700, photos: PHOTOS.running_shoes,
  },
  {
    title: "Block Heel Mules Nude",
    description: "Elegant nude block heel mules. Very comfortable padded insole. Light scuff on toe of left shoe.",
    category: "SHOES_BAGS", itemType: "Mules", brand: "Aldo", size: "EU 39", genderTarget: "WOMEN",
    condition: "GOOD", retailPrice: 4800, payoutPrice: 2300, photos: PHOTOS.heels,
  },
  {
    title: "Gold Strappy Heeled Sandals",
    description: "Stunning gold strappy heeled sandals. Worn to one event. Barely used — bottoms still clean.",
    category: "SHOES_BAGS", itemType: "Heeled Sandals", brand: null, size: "EU 38", genderTarget: "WOMEN",
    condition: "EXCELLENT", retailPrice: 3800, payoutPrice: 1900, photos: PHOTOS.heels,
  },
  {
    title: "Clarks Black Oxford Brogues",
    description: "Classic black leather Oxford brogues by Clarks. Recently polished. Light sole wear from regular use. EU 43.",
    category: "SHOES_BAGS", itemType: "Oxford Shoes", brand: "Clarks", size: "EU 43", genderTarget: "MEN",
    condition: "GOOD", retailPrice: 7200, payoutPrice: 3600, photos: PHOTOS.loafers,
  },
  {
    title: "Brown Platform Loafers",
    description: "Trendy brown platform loafers. Very comfortable — extra height from thick rubber sole. Worn 4 times, no damage.",
    category: "SHOES_BAGS", itemType: "Loafers", brand: "ASOS", size: "EU 39", genderTarget: "WOMEN",
    condition: "EXCELLENT", retailPrice: 5500, payoutPrice: 2700, photos: PHOTOS.loafers,
  },
  {
    title: "Brand New Adidas Stan Smith",
    description: "Brand new Adidas Stan Smith in white/green. Original box. Never worn. US 9.",
    category: "SHOES_BAGS", itemType: "Sneakers", brand: "Adidas", size: "US 9", genderTarget: "UNISEX",
    condition: "BRAND_NEW", retailPrice: 9000, payoutPrice: 4500, photos: PHOTOS.white_sneakers,
  },
  // ── BAGS ───────────────────────────────────────────────────────────────────
  {
    title: "Mini Black Leather Crossbody",
    description: "Chic black leather mini crossbody bag. Gold hardware, adjustable strap. Minor scuff on back that polishes out.",
    category: "SHOES_BAGS", itemType: "Crossbody Bag", brand: "Zara", size: "ONE SIZE", genderTarget: "WOMEN",
    condition: "GOOD", retailPrice: 4500, payoutPrice: 2200, photos: PHOTOS.leather_bag,
  },
  {
    title: "Tan Leather Structured Satchel",
    description: "Classic structured tan leather satchel with gold buckle details. Excellent condition — minimal use.",
    category: "SHOES_BAGS", itemType: "Satchel", brand: "Coach", size: "ONE SIZE", genderTarget: "WOMEN",
    condition: "EXCELLENT", retailPrice: 14500, payoutPrice: 7200, photos: PHOTOS.leather_bag,
  },
  {
    title: "Pink Quilted Mini Bag",
    description: "Cute pink quilted chain-strap mini bag. Perfect for evenings or casual daytime. Chain strap, zip closure.",
    category: "SHOES_BAGS", itemType: "Mini Bag", brand: null, size: "ONE SIZE", genderTarget: "WOMEN",
    condition: "EXCELLENT", retailPrice: 3800, payoutPrice: 1900, photos: PHOTOS.pink_bag,
  },
  {
    title: "Oversized Canvas Tote Bag",
    description: "Roomy off-white canvas tote. Double leather handles. Perfect for the farmers market or the beach. Light pen mark inside.",
    category: "SHOES_BAGS", itemType: "Tote Bag", brand: "Madewell", size: "ONE SIZE", genderTarget: "UNISEX",
    condition: "GOOD", retailPrice: 5500, payoutPrice: 2700, photos: PHOTOS.tote_bag,
  },
  {
    title: "Men's Brown Leather Laptop Bag",
    description: "Professional brown full-grain leather laptop bag. Fits 15\" laptop. Light corner scuff from daily commute.",
    category: "SHOES_BAGS", itemType: "Laptop Bag", brand: null, size: "ONE SIZE", genderTarget: "MEN",
    condition: "GOOD", retailPrice: 8500, payoutPrice: 4200, photos: PHOTOS.leather_bag,
  },
  // ── ACCESSORIES ────────────────────────────────────────────────────────────
  {
    title: "Ray-Ban Tortoiseshell Wayfarers",
    description: "Authentic Ray-Ban tortoiseshell Wayfarer sunglasses. UV400 lenses. Light surface scratches on frames. Case not included.",
    category: "ACCESSORIES", itemType: "Sunglasses", brand: "Ray-Ban", size: "ONE SIZE", genderTarget: "UNISEX",
    condition: "GOOD", retailPrice: 9800, payoutPrice: 4900, photos: PHOTOS.sunglasses,
  },
  {
    title: "Classic Leather Strap Watch",
    description: "Clean analogue watch with brown leather strap and white dial. Battery replaced. Light strap patina.",
    category: "ACCESSORIES", itemType: "Watch", brand: "Timex", size: "ONE SIZE", genderTarget: "UNISEX",
    condition: "GOOD", retailPrice: 6500, payoutPrice: 3200, photos: PHOTOS.watch,
  },
  {
    title: "Wide Brim Straw Sun Hat",
    description: "Stylish natural straw wide brim hat. Great for the beach or summer festivals. Minor dent from storage — easily reshaped.",
    category: "ACCESSORIES", itemType: "Hat", brand: null, size: "ONE SIZE", genderTarget: "WOMEN",
    condition: "GOOD", retailPrice: 2800, payoutPrice: 1300, photos: PHOTOS.hat,
  },
  {
    title: "Gold Chunky Chain Necklace",
    description: "Bold gold-tone chunky link chain necklace. No tarnishing. Fashion jewellery but high-quality plating.",
    category: "ACCESSORIES", itemType: "Necklace", brand: "Zara", size: "ONE SIZE", genderTarget: "WOMEN",
    condition: "EXCELLENT", retailPrice: 2500, payoutPrice: 1200, photos: PHOTOS.sunglasses,
  },
  {
    title: "Bucket Hat Black Corduroy",
    description: "Trendy black corduroy bucket hat. Unisex sizing, fits most heads. Worn a few times — clean and in great shape.",
    category: "ACCESSORIES", itemType: "Hat", brand: "Carhartt", size: "ONE SIZE", genderTarget: "UNISEX",
    condition: "EXCELLENT", retailPrice: 3500, payoutPrice: 1700, photos: PHOTOS.hat,
  },
  {
    title: "Brand New Swiss Watch — Minimalist",
    description: "Brand new minimalist Swiss movement watch with mesh strap. Never worn. Original packaging and documentation included.",
    category: "ACCESSORIES", itemType: "Watch", brand: "MVMT", size: "ONE SIZE", genderTarget: "UNISEX",
    condition: "BRAND_NEW", retailPrice: 15500, payoutPrice: 7700, photos: PHOTOS.watch,
  },
  {
    title: "Silk Neck Scarf Floral",
    description: "Luxurious silk-feel neck scarf with a botanical floral print. Wear as neck tie, headband, or bag accessory.",
    category: "ACCESSORIES", itemType: "Scarf", brand: null, size: "ONE SIZE", genderTarget: "WOMEN",
    condition: "EXCELLENT", retailPrice: 2200, payoutPrice: 1000, photos: PHOTOS.hat,
  },
  {
    title: "Black Leather Belt — Silver Buckle",
    description: "Classic full-grain black leather belt with polished silver buckle. 34\" waist. Barely used.",
    category: "ACCESSORIES", itemType: "Belt", brand: "Fossil", size: "34\"", genderTarget: "MEN",
    condition: "EXCELLENT", retailPrice: 3800, payoutPrice: 1900, photos: PHOTOS.watch,
  },
  {
    title: "Wayfarers — Clear Lens",
    description: "Clear lens wayfarer-style fashion glasses. Great for a clean preppy look. No prescription. Worn as accessories only.",
    category: "ACCESSORIES", itemType: "Glasses", brand: null, size: "ONE SIZE", genderTarget: "UNISEX",
    condition: "EXCELLENT", retailPrice: 1800, payoutPrice: 800, photos: PHOTOS.sunglasses,
  },
];

async function main() {
  console.log("🌱  Seeding items (full approval flow)...\n");

  const seller = await db.user.findUnique({
    where: { email: "seller@thread.com" },
    include: { sellerProfile: true },
  });
  if (!seller?.sellerProfile) throw new Error("Run seed.ts first to create seller account");

  const admin = await db.user.findUnique({
    where: { email: "admin@thread.com" },
    include: { adminProfile: true },
  });
  if (!admin?.adminProfile) throw new Error("Run seed.ts first to create admin account");

  const sellerId = seller.sellerProfile.id;
  const adminId = admin.adminProfile.id;

  let count = 0;
  for (const item of ITEMS) {
    const submission = await db.submission.create({
      data: {
        sellerId,
        category:           item.category as any,
        itemType:           item.itemType,
        brand:              item.brand,
        size:               item.size,
        genderTarget:       item.genderTarget as any,
        condition:          item.condition as any,
        photos:             item.photos,
        sellerDescription:  item.description,
        adminDescription:   item.description,
        desiredPayoutPrice: item.payoutPrice,
        agreedPayoutPrice:  item.payoutPrice,
        retailPrice:        item.retailPrice,
        status:             "LIVE",
        reviewedById:       adminId,
        reviewedAt:         new Date(),
      },
    });

    await db.item.create({
      data: {
        submissionId:      submission.id,
        slug:              slug(item.title, count + 1),
        title:             item.title,
        description:       item.description,
        category:          item.category as any,
        itemType:          item.itemType,
        brand:             item.brand,
        size:              item.size,
        genderTarget:      item.genderTarget as any,
        condition:         item.condition as any,
        photos:            item.photos,
        retailPrice:       item.retailPrice,
        agreedPayoutPrice: item.payoutPrice,
        isLive:            true,
        publishedAt:       new Date(),
      },
    });

    count++;
    process.stdout.write(`  ✅  [${count}/${ITEMS.length}] ${item.title}\n`);
  }

  console.log(`\n🎉  Done! ${count} items are now live on the storefront.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
