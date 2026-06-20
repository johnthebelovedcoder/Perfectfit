/**
 * Seeds 20 PENDING_REVIEW submissions for admin workflow testing.
 * Covers: negotiations, approvals, rejections, more-info requests.
 *
 * Run:
 *   cd packages/database
 *   npx ts-node --project tsconfig.build.json prisma/seed-test-submissions.ts
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const SUBMISSIONS = [
  // ── Tops ──────────────────────────────────────────────────────────────────
  {
    itemType: "Vintage Band Tee",
    category: "ANKARA_OUTFITS",
    brand: "Vintage",
    size: "M",
    gender: "UNISEX",
    condition: "GOOD",
    conditionNote: "Small fade on logo print, consistent with age. No holes or stains.",
    desc: "Original 1990s Nirvana concert tee. Worn but well loved. A true collector piece.",
    priceCents: 4500,
    photos: ["samples/ecommerce/leather-bag-gray"],
  },
  {
    itemType: "Silk Blouse",
    category: "ANKARA_OUTFITS",
    brand: "Reiss",
    size: "S",
    gender: "WOMEN",
    condition: "EXCELLENT",
    desc: "Ivory silk blouse with pearl buttons. Dry cleaned after single wear. No marks.",
    priceCents: 6000,
    photos: ["samples/ecommerce/leather-bag-gray"],
  },
  {
    itemType: "Oversized Graphic Hoodie",
    category: "ANKARA_OUTFITS",
    brand: "Supreme",
    size: "L",
    gender: "UNISEX",
    condition: "EXCELLENT",
    desc: "SS22 box logo hoodie in white. Worn twice. Stored flat, no pilling.",
    priceCents: 18000,
    photos: ["samples/ecommerce/accessories-bag"],
  },

  // ── Bottoms ───────────────────────────────────────────────────────────────
  {
    itemType: "High-Waist Wide Leg Trousers",
    category: "SKIRTS_BLOUSES",
    brand: "Zara",
    size: "M",
    gender: "WOMEN",
    condition: "EXCELLENT",
    desc: "Black tailored wide-leg trousers. Worn twice, steam ironed after each wear.",
    priceCents: 4000,
    photos: ["samples/ecommerce/leather-bag-gray"],
  },
  {
    itemType: "Slim Fit Chinos",
    category: "SKIRTS_BLOUSES",
    brand: "Uniqlo",
    size: "32x32",
    gender: "MEN",
    condition: "GOOD",
    conditionNote: "Slight crease on right knee from storage. Washes out easily.",
    desc: "Navy slim chinos. Versatile, comfortable, machine washable. Some light wear at belt loops.",
    priceCents: 3000,
    photos: ["samples/ecommerce/accessories-bag"],
  },
  {
    itemType: "Distressed Skinny Jeans",
    category: "SKIRTS_BLOUSES",
    brand: "Topshop",
    size: "W28 L30",
    gender: "WOMEN",
    condition: "FAIR",
    conditionNote: "Intentional distressing at knees plus additional wear at back pockets. Priced accordingly.",
    desc: "Classic Topshop Joni jeans in black. The distressing adds character but noted for transparency.",
    priceCents: 2500,
    photos: ["samples/ecommerce/leather-bag-gray"],
  },

  // ── Dresses ───────────────────────────────────────────────────────────────
  {
    itemType: "Slip Dress",
    category: "DRESSES_GOWNS",
    brand: "& Other Stories",
    size: "S",
    gender: "WOMEN",
    condition: "BRAND_NEW",
    desc: "Sage green satin slip dress. Tags still attached, never worn. Bought wrong size.",
    priceCents: 9000,
    photos: ["samples/ecommerce/leather-bag-gray"],
  },
  {
    itemType: "Bodycon Mini Dress",
    category: "DRESSES_GOWNS",
    brand: "Oh Polly",
    size: "8",
    gender: "WOMEN",
    condition: "EXCELLENT",
    desc: "Cobalt blue ruched bodycon. Worn once to a birthday dinner. Hand washed, air dried.",
    priceCents: 5500,
    photos: ["samples/ecommerce/accessories-bag"],
  },
  {
    itemType: "Maxi Wrap Dress",
    category: "DRESSES_GOWNS",
    brand: "Diane von Furstenberg",
    size: "UK 10",
    gender: "WOMEN",
    condition: "EXCELLENT",
    desc: "Iconic DVF wrap in tropical print. A wardrobe staple I no longer reach for. Dry cleaned.",
    priceCents: 22000,
    photos: ["samples/ecommerce/leather-bag-gray"],
  },

  // ── Outerwear ─────────────────────────────────────────────────────────────
  {
    itemType: "Trench Coat",
    category: "LACE_OUTFITS",
    brand: "Burberry",
    size: "M",
    gender: "WOMEN",
    condition: "GOOD",
    conditionNote: "Small stain on inner lining near pocket. Not visible when worn.",
    desc: "Classic honey Burberry trench. Belted, knee-length. Professionally cleaned last season.",
    priceCents: 55000,
    photos: ["samples/ecommerce/accessories-bag"],
  },
  {
    itemType: "Puffer Gilet",
    category: "LACE_OUTFITS",
    brand: "The North Face",
    size: "L",
    gender: "UNISEX",
    condition: "GOOD",
    desc: "700-fill down gilet in olive green. Light scuff on zipper pull, all pockets intact.",
    priceCents: 9500,
    photos: ["samples/ecommerce/leather-bag-gray"],
  },
  {
    itemType: "Leather Biker Jacket",
    category: "LACE_OUTFITS",
    brand: "AllSaints",
    size: "S",
    gender: "WOMEN",
    condition: "EXCELLENT",
    desc: "Black genuine leather moto jacket. Asymmetric zip, quilted shoulders. Conditioned regularly.",
    priceCents: 28000,
    photos: ["samples/ecommerce/accessories-bag"],
  },

  // ── Shoes ─────────────────────────────────────────────────────────────────
  {
    itemType: "Classic Leather Loafers",
    category: "SHOES_BAGS",
    brand: "Tod's",
    size: "EU 38",
    gender: "WOMEN",
    condition: "GOOD",
    conditionNote: "Moderate sole wear, some light scuffs on toe box. Leather is supple.",
    desc: "Tan leather driving loafers. An effortless everyday shoe I'm parting with.",
    priceCents: 14000,
    photos: ["samples/ecommerce/leather-bag-gray"],
  },
  {
    itemType: "Chelsea Boots",
    category: "SHOES_BAGS",
    brand: "Dr. Martens",
    size: "UK 5",
    gender: "WOMEN",
    condition: "EXCELLENT",
    desc: "Classic black leather Chelsea boots, barely broken in. Wore 3 times, then sized up.",
    priceCents: 8500,
    photos: ["samples/ecommerce/accessories-bag"],
  },
  {
    itemType: "Air Force 1 Low",
    category: "SHOES_BAGS",
    brand: "Nike",
    size: "UK 9",
    gender: "MEN",
    condition: "GOOD",
    conditionNote: "Slight creasing on toe box from regular wear. Sole clean, original laces.",
    desc: "Triple white AF1s. A reliable everyday rotation piece being retired.",
    priceCents: 6000,
    photos: ["samples/ecommerce/leather-bag-gray"],
  },

  // ── Bags ──────────────────────────────────────────────────────────────────
  {
    itemType: "Mini Tote Bag",
    category: "SHOES_BAGS",
    brand: "A.P.C.",
    size: "ONE SIZE",
    gender: "WOMEN",
    condition: "EXCELLENT",
    desc: "The iconic APC mini shopper in ecru canvas. Minimal wear, gold hardware intact.",
    priceCents: 16000,
    photos: ["samples/ecommerce/accessories-bag"],
  },
  {
    itemType: "Backpack",
    category: "SHOES_BAGS",
    brand: "Herschel",
    size: "ONE SIZE",
    gender: "UNISEX",
    condition: "GOOD",
    conditionNote: "Pen mark on inner pocket lining. Not visible from outside.",
    desc: "Navy Little America backpack. Fits 15-inch laptop. Light daily use.",
    priceCents: 5000,
    photos: ["samples/ecommerce/leather-bag-gray"],
  },

  // ── Accessories ───────────────────────────────────────────────────────────
  {
    itemType: "Wool Scarf",
    category: "ACCESSORIES",
    brand: "Acne Studios",
    size: "ONE SIZE",
    gender: "UNISEX",
    condition: "EXCELLENT",
    desc: "Oversized Acne Studios fringe scarf in oatmeal. Practically unworn. Season 22.",
    priceCents: 12000,
    photos: ["samples/ecommerce/accessories-bag"],
  },
  {
    itemType: "Gold Hoop Earrings Set",
    category: "ACCESSORIES",
    brand: "Monica Vinader",
    size: "ONE SIZE",
    gender: "WOMEN",
    condition: "EXCELLENT",
    desc: "Set of 3 gold vermeil hoops (small, medium, large). Polished before listing.",
    priceCents: 8000,
    photos: ["samples/ecommerce/leather-bag-gray"],
  },
  {
    itemType: "Canvas Belt",
    category: "ACCESSORIES",
    brand: "Gucci",
    size: "85cm",
    gender: "UNISEX",
    condition: "GOOD",
    conditionNote: "Small nick on GG buckle edge, not visible when worn. Belt itself pristine.",
    desc: "Gucci web stripe canvas belt. Classic style, slight buckle wear.",
    priceCents: 19000,
    photos: ["samples/ecommerce/accessories-bag"],
  },
];

async function main() {
  const seller = await db.user.findUnique({
    where: { email: "seller@thread.com" },
    include: { sellerProfile: true },
  });

  if (!seller?.sellerProfile) {
    throw new Error(
      'Seller user not found. Make sure seed.ts has been run first (email: seller@thread.com)'
    );
  }

  console.log(`\nSeeding 20 submissions for ${seller.sellerProfile.firstName} ${seller.sellerProfile.lastName}...\n`);

  for (const item of SUBMISSIONS) {
    await db.submission.create({
      data: {
        sellerId: seller.sellerProfile.id,
        category: item.category as any,
        itemType: item.itemType,
        brand: item.brand ?? null,
        size: item.size,
        genderTarget: item.gender as any,
        condition: item.condition as any,
        conditionNote: item.conditionNote ?? null,
        photos: item.photos,
        sellerDescription: item.desc,
        desiredPayoutPrice: item.priceCents,
        status: "PENDING_REVIEW",
      },
    });
    console.log(`  ✅  ${item.category.padEnd(12)}  ${item.brand ?? "—"} ${item.itemType}  (asks ${(item.priceCents / 100).toFixed(2)} USD)`);
  }

  console.log(`\n🎉  20 PENDING_REVIEW submissions created.`);
  console.log("    → http://localhost:3003/submissions\n");
  console.log("Suggested test scenarios:");
  console.log("  Accept at asking price     → Vintage Band Tee, Silk Blouse");
  console.log("  Negotiate lower payout     → Burberry Trench, Gucci Belt, AllSaints Jacket");
  console.log("  Reject (condition)         → Distressed Skinny Jeans, Herschel Backpack");
  console.log("  Request more info          → Leather Loafers, Chelsea Boots");
  console.log("  Accept & full flow to live → Slip Dress (BRAND_NEW, clean listing)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
