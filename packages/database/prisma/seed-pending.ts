/**
 * Creates 5 pending-review submissions so admin can demo the full approval flow.
 * Run: npx ts-node --project tsconfig.build.json prisma/seed-pending.ts
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const PENDING = [
  { itemType: "Oversized Denim Jacket", category: "LACE_OUTFITS", brand: "Zara", size: "M", gender: "WOMEN", condition: "EXCELLENT", desc: "Beautiful oversized denim jacket, barely worn. Classic blue wash.", price: 15000, photos: ["samples/ecommerce/leather-bag-gray"] },
  { itemType: "Nike Air Max Sneakers", category: "SHOES_BAGS", brand: "Nike", size: "43", gender: "MEN", condition: "GOOD", desc: "Nike Air Max 90, worn 3 times. Soles still clean.", price: 20000, photos: ["samples/ecommerce/accessories-bag"] },
  { itemType: "Floral Wrap Dress", category: "DRESSES_GOWNS", brand: "ASOS", size: "12", gender: "WOMEN", condition: "EXCELLENT", desc: "Gorgeous floral wrap midi dress. Worn once for a photoshoot.", price: 18000, photos: ["samples/ecommerce/leather-bag-gray"] },
  { itemType: "Leather Crossbody Bag", category: "SHOES_BAGS", brand: "Coach", size: "ONE SIZE", gender: "WOMEN", condition: "GOOD", desc: "Authentic Coach crossbody in tan leather. Adjustable strap, minor scuff on corner.", price: 35000, photos: ["samples/ecommerce/accessories-bag"] },
  { itemType: "Wool Blend Blazer", category: "LACE_OUTFITS", brand: "H&M", size: "L", gender: "MEN", condition: "EXCELLENT", desc: "Smart slim-fit wool blend blazer. Perfect for office or events. Dry cleaned.", price: 22000, photos: ["samples/ecommerce/leather-bag-gray"] },
];

async function main() {
  const seller = await db.user.findUnique({ where: { email: "seller@thread.com" }, include: { sellerProfile: true } });
  if (!seller?.sellerProfile) throw new Error("Run seed.ts first");

  for (const item of PENDING) {
    await db.submission.create({
      data: {
        sellerId: seller.sellerProfile.id,
        category: item.category as any,
        itemType: item.itemType,
        brand: item.brand,
        size: item.size,
        genderTarget: item.gender as any,
        condition: item.condition as any,
        photos: item.photos,
        sellerDescription: item.desc,
        desiredPayoutPrice: item.price * 100,
        status: "PENDING_REVIEW",
      },
    });
    console.log(`  ✅  Created PENDING_REVIEW: ${item.itemType}`);
  }
  console.log("\n🎉  5 pending submissions ready for admin review.");
  console.log("    Go to http://localhost:3003/submissions to review them.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
