import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// All images are free-licensed Unsplash photos (verified to load), themed to
// African fashion. Stored as direct URLs — getCloudinaryUrl passes them through.
const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;

const POOL = {
  womens: ["1612659513025-fe37f67574d6", "1509099955921-f0b4ed0c175c", "1505421031134-e57263cae630", "1625646741211-711bdd65c570", "1532076904124-d4e8fe7fbbec", "1602794837437-89ab353d5b4a", "1631620570575-486ce20df339", "1664662566408-ef40c502a66b"],
  agbada: ["1687952622898-4e9514a710d5", "1663044022559-9a0e0215abea", "1663043994777-7ed4b4e6cba3", "1663044023437-6b3f9be28a90", "1663044022726-889ee51a682e", "1663044022894-68a5e6bccd64", "1663044022913-8913ff9ff2bc", "1663044022903-caa195cb5b2e", "1663044023153-2e0c4f2debc7"],
  ankara: ["1663044022648-08bf87cfdc05", "1663044022557-7d5d4c1d5318", "1663044022596-25bc5df1c6e0", "1698751309114-ace3eb286a5b", "1663044023460-f0c1911899ea", "1663044023448-7ad363482c91", "1663044022759-16a289ffc240", "1663044022768-f4bb7b597b2c", "1663044022996-ac509fe98af2", "1663044023079-895d5db1fad1", "1663044023636-368f33b185b8", "1663044022968-baba8bb04e23"],
  wedding: ["1660675133902-acd1b057f75d", "1661332517932-2d441bfb2994", "1547496727-11c450fe4e7f", "1618999114008-fbf937170cdb", "1580394640019-00d34094ae13", "1684253866485-b26f847ff97e", "1665258918932-9e358bcfba0f", "1618998584360-10a0c28eec0f", "1655682604826-7530b331b3e7", "1661332306744-70f9ed1a7f40"],
  gele: ["1681597107084-0d7f22e3225d", "1625311451171-7a009727f694", "1655902583780-2d5194eb32df", "1655902586913-e81bce3adeec", "1655902586361-8b3a59be1dd7"],
  lace: ["1623609163859-ca93c959b98a", "1718871716580-117417d490f6", "1623609163841-5e69d8c62cc7", "1591221662157-6f62de5508eb", "1507088991476-665ae61e1eec", "1586685983546-0d25211d7166", "1524649847196-ccb8e27b902d", "1603796846900-d61a14c890ef", "1513262834354-6b2bca9b5b8d", "1614867738158-f2cf8eaade16"],
  adire: ["1585751092218-cea84c1ecf01", "1540292370723-60cf448886c3", "1681756880527-52c73fa240d1", "1625825894188-70abe2df5f3f", "1465199549974-7d82de6e2830", "1524404886881-0beaa13c7b78", "1618486257759-a323557c1b88", "1597480552972-de9b150b5b43"],
  children: ["1529245019870-59b249281fd3", "1611428813653-aa606c998586", "1532334836699-88e90d97c8fe", "1539887523427-bb750641ad29", "1513180549775-7de46ae74999", "1729480782700-255101915e94", "1722481734976-596ed919bbe2", "1628361003242-a03b2d5eeb53"],
  bags: ["1682364853446-db043f643207", "1597633125097-5a9961e1f03d", "1615206928955-ce0ffbb7ca5a", "1617229378071-daa5eeff0db7", "1546333456-3e8ed81f41e2", "1667687038826-3d00484bce96", "1554219300-77dd3aa483c0", "1636347522564-1f71a4116355", "1566958799193-c2aa57a835d4", "1521650326612-126383c9c0e4", "1594054763281-0946baaad462", "1618236444721-4a8dba415c15"],
};

// Rotating offset per pool so each product gets a distinct slice of photos.
const cursors: Record<string, number> = {};
function pics(pool: keyof typeof POOL, n = 3): string[] {
  const arr = POOL[pool];
  const start = cursors[pool] ?? 0;
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(u(arr[(start + i) % arr.length]!));
  cursors[pool] = (start + n) % arr.length;
  return out;
}

function slug(title: string, n: number): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + n;
}

interface Seed {
  title: string; description: string; category: string; itemType: string;
  brand?: string; size: string; genderTarget: string; condition: string;
  retailPrice: number; payoutPrice: number; pool: keyof typeof POOL;
}

const ITEMS: Seed[] = [
  // ── Women's African Wear ──
  { title: "Ankara Peplum Top & Wrapper Set", description: "Vibrant two-piece Ankara set with a structured peplum top and matching wrapper skirt. Fully lined, expertly tailored. Worn once to an owambe.", category: "WOMENS_AFRICAN_WEAR", itemType: "Two-Piece Set", size: "M", genderTarget: "WOMEN", condition: "EXCELLENT", retailPrice: 8500, payoutPrice: 5000, pool: "womens" },
  { title: "Embellished Kaftan Maxi Dress", description: "Flowing floor-length kaftan in rich emerald with gold bead embellishment at the neckline. Effortless, elegant, and comfortable.", category: "WOMENS_AFRICAN_WEAR", itemType: "Kaftan", size: "L", genderTarget: "WOMEN", condition: "EXCELLENT", retailPrice: 9200, payoutPrice: 5500, pool: "womens" },
  { title: "Off-Shoulder Ankara Jumpsuit", description: "Statement off-shoulder jumpsuit in a bold geometric Ankara print. Wide-leg cut with a tie waist. A real head-turner.", category: "WOMENS_AFRICAN_WEAR", itemType: "Jumpsuit", size: "S", genderTarget: "WOMEN", condition: "BRAND_NEW", retailPrice: 7800, payoutPrice: 4600, pool: "womens" },

  // ── Men's African Wear ──
  { title: "Embroidered Senator Suit", description: "Sharp two-piece Senator in navy with subtle tonal embroidery on the chest and cuffs. Tailored fit. Dry-cleaned, like new.", category: "MENS_AFRICAN_WEAR", itemType: "Senator", brand: "Bespoke", size: "L", genderTarget: "MEN", condition: "EXCELLENT", retailPrice: 12000, payoutPrice: 7200, pool: "agbada" },
  { title: "Kente Trim Dashiki Shirt", description: "Classic dashiki in cream cotton with handwoven Kente trim at the collar and pockets. Breathable and comfortable for any occasion.", category: "MENS_AFRICAN_WEAR", itemType: "Dashiki", size: "XL", genderTarget: "MEN", condition: "GOOD", retailPrice: 5500, payoutPrice: 3200, pool: "agbada" },
  { title: "Guinea Brocade Two-Piece", description: "Premium Guinea brocade kaftan and trouser set in royal blue. Soft sheen, immaculate stitching. Perfect for Friday jumat or events.", category: "MENS_AFRICAN_WEAR", itemType: "Brocade Set", size: "L", genderTarget: "MEN", condition: "EXCELLENT", retailPrice: 9800, payoutPrice: 5800, pool: "agbada" },

  // ── Children's African Wear ──
  { title: "Boys' Ankara Senator Set", description: "Adorable mini Senator set for boys in a coordinated Ankara print. Two-piece with elastic-waist trousers. Fits ages 5–7.", category: "CHILDRENS_AFRICAN_WEAR", itemType: "Senator Set", size: "5-7Y", genderTarget: "KIDS", condition: "EXCELLENT", retailPrice: 3500, payoutPrice: 2000, pool: "children" },
  { title: "Girls' Ankara Flare Dress", description: "Twirl-worthy flared Ankara dress with puff sleeves and a bow sash. Lined bodice for comfort. Fits ages 3–5.", category: "CHILDRENS_AFRICAN_WEAR", itemType: "Dress", size: "3-5Y", genderTarget: "KIDS", condition: "BRAND_NEW", retailPrice: 3200, payoutPrice: 1900, pool: "children" },
  { title: "Kids' Dashiki Two-Piece", description: "Bright dashiki top and shorts set in soft cotton. Easy to wear, easy to wash. Fits ages 6–8.", category: "CHILDRENS_AFRICAN_WEAR", itemType: "Two-Piece", size: "6-8Y", genderTarget: "KIDS", condition: "GOOD", retailPrice: 2800, payoutPrice: 1600, pool: "children" },

  // ── Ankara Outfits ──
  { title: "Classic Ankara Print Gown", description: "Floor-sweeping Ankara gown with a fitted bodice and flared skirt. Bold orange-and-blue print, fully lined. A timeless piece.", category: "ANKARA_OUTFITS", itemType: "Gown", size: "M", genderTarget: "WOMEN", condition: "EXCELLENT", retailPrice: 7500, payoutPrice: 4500, pool: "ankara" },
  { title: "Ankara Bubble-Sleeve Dance Dress", description: "Playful midi dress with dramatic bubble sleeves in a mixed Ankara print. Flattering A-line cut.", category: "ANKARA_OUTFITS", itemType: "Dress", size: "S", genderTarget: "WOMEN", condition: "BRAND_NEW", retailPrice: 6800, payoutPrice: 4000, pool: "ankara" },
  { title: "Ankara Wide-Leg Trouser Set", description: "Co-ord set with a cropped top and high-waist wide-leg trousers in a striking Ankara wax print. Effortlessly chic.", category: "ANKARA_OUTFITS", itemType: "Co-ord Set", size: "M", genderTarget: "WOMEN", condition: "EXCELLENT", retailPrice: 8200, payoutPrice: 4900, pool: "ankara" },
  { title: "Ankara Bomber Jacket", description: "Reversible Ankara bomber with ribbed cuffs and hem. Unisex fit, lightweight padding. Streetwear meets heritage.", category: "ANKARA_OUTFITS", itemType: "Jacket", size: "L", genderTarget: "UNISEX", condition: "GOOD", retailPrice: 5900, payoutPrice: 3500, pool: "ankara" },

  // ── Lace Outfits ──
  { title: "French Lace Boubou Gown", description: "Luxurious French lace boubou in dusty rose with a satin under-slip. Soft drape and delicate floral lacework.", category: "LACE_OUTFITS", itemType: "Boubou", size: "L", genderTarget: "WOMEN", condition: "EXCELLENT", retailPrice: 13500, payoutPrice: 8200, pool: "lace" },
  { title: "Cord Lace Long-Sleeve Gown", description: "Elegant cord lace gown in champagne with scalloped hem and sleeves. Aso-ebi favourite. Worn once.", category: "LACE_OUTFITS", itemType: "Gown", size: "M", genderTarget: "WOMEN", condition: "EXCELLENT", retailPrice: 11000, payoutPrice: 6600, pool: "lace" },
  { title: "Beaded Lace Asoebi Dress", description: "Hand-beaded lace dress with a sweetheart neckline and fitted silhouette. Subtle stonework throughout.", category: "LACE_OUTFITS", itemType: "Dress", size: "S", genderTarget: "WOMEN", condition: "BRAND_NEW", retailPrice: 12500, payoutPrice: 7500, pool: "lace" },

  // ── Aso-Oke Attire ──
  { title: "Handwoven Aso-Oke Iro & Buba", description: "Traditional handwoven Aso-Oke set — iro (wrapper) and buba (blouse) in burgundy and gold. Heirloom-quality weave.", category: "ASO_OKE_ATTIRE", itemType: "Iro & Buba", size: "M", genderTarget: "WOMEN", condition: "EXCELLENT", retailPrice: 18000, payoutPrice: 11000, pool: "wedding" },
  { title: "Aso-Oke Agbada Ceremonial Set", description: "Regal Aso-Oke agbada three-piece for the groom or chief. Richly woven with metallic threads. Statement attire.", category: "ASO_OKE_ATTIRE", itemType: "Agbada Set", size: "XL", genderTarget: "MEN", condition: "EXCELLENT", retailPrice: 22000, payoutPrice: 13500, pool: "wedding" },
  { title: "Aso-Oke Fila & Wrapper Combo", description: "Matching Aso-Oke fila cap and wrapper in classic etu indigo. Finished by hand. Adds gravitas to any traditional look.", category: "ASO_OKE_ATTIRE", itemType: "Fila & Wrapper", size: "One Size", genderTarget: "MEN", condition: "GOOD", retailPrice: 9500, payoutPrice: 5700, pool: "wedding" },

  // ── Adire Wear ──
  { title: "Indigo Adire Eleko Kaftan", description: "Hand-dyed Adire eleko kaftan in deep indigo with a traditional starch-resist pattern. Soft, breathable cotton.", category: "ADIRE_WEAR", itemType: "Kaftan", size: "L", genderTarget: "UNISEX", condition: "EXCELLENT", retailPrice: 6500, payoutPrice: 3900, pool: "adire" },
  { title: "Adire Tie-Dye Maxi Dress", description: "Flowy Adire maxi with a hand tie-dyed sunburst motif. Adjustable straps and side pockets. One-of-a-kind.", category: "ADIRE_WEAR", itemType: "Maxi Dress", size: "M", genderTarget: "WOMEN", condition: "BRAND_NEW", retailPrice: 7200, payoutPrice: 4300, pool: "adire" },
  { title: "Adire Two-Piece Lounge Set", description: "Relaxed Adire shirt-and-shorts lounge set in indigo and white. Effortless weekend wear with heritage roots.", category: "ADIRE_WEAR", itemType: "Lounge Set", size: "S", genderTarget: "UNISEX", condition: "GOOD", retailPrice: 5800, payoutPrice: 3500, pool: "adire" },

  // ── Kaftans & Agbada ──
  { title: "Royal Embroidered Agbada (3-Piece)", description: "Show-stopping agbada three-piece in wine with intricate gold machine embroidery. Includes agbada, inner and trousers.", category: "KAFTANS_AGBADA", itemType: "Agbada", size: "XL", genderTarget: "MEN", condition: "EXCELLENT", retailPrice: 24000, payoutPrice: 15000, pool: "agbada" },
  { title: "Plain Cotton Kaftan", description: "Everyday cotton kaftan in off-white with a simple placket. Cool and comfortable for the heat. Lightly worn.", category: "KAFTANS_AGBADA", itemType: "Kaftan", size: "L", genderTarget: "MEN", condition: "GOOD", retailPrice: 4500, payoutPrice: 2700, pool: "agbada" },
  { title: "Guinea Brocade Agbada Set", description: "Premium Guinea brocade agbada with subtle self-embroidery. Crisp, structured, and regal. Dry-cleaned.", category: "KAFTANS_AGBADA", itemType: "Agbada Set", size: "L", genderTarget: "MEN", condition: "EXCELLENT", retailPrice: 19500, payoutPrice: 12000, pool: "agbada" },

  // ── Dresses & Gowns ──
  { title: "Stoned Lace Evening Gown", description: "Floor-length evening gown in midnight lace with all-over stonework. Built-in corset bodice. Red-carpet ready.", category: "DRESSES_GOWNS", itemType: "Evening Gown", size: "M", genderTarget: "WOMEN", condition: "EXCELLENT", retailPrice: 15000, payoutPrice: 9000, pool: "lace" },
  { title: "Ankara Mermaid Gown", description: "Figure-hugging mermaid gown in a vivid Ankara print with a dramatic flare at the hem. Fully boned bodice.", category: "DRESSES_GOWNS", itemType: "Gown", size: "S", genderTarget: "WOMEN", condition: "BRAND_NEW", retailPrice: 9800, payoutPrice: 5900, pool: "womens" },
  { title: "Chiffon Aso-ebi Gown", description: "Soft draped chiffon gown in coral with a cape sleeve. The perfect guest outfit for any wedding.", category: "DRESSES_GOWNS", itemType: "Gown", size: "L", genderTarget: "WOMEN", condition: "EXCELLENT", retailPrice: 8500, payoutPrice: 5100, pool: "womens" },

  // ── Skirts & Blouses ──
  { title: "Ankara Pencil Skirt & Blouse", description: "Office-ready set with a fitted Ankara pencil skirt and a coordinating satin blouse. Smart and polished.", category: "SKIRTS_BLOUSES", itemType: "Skirt & Blouse", size: "M", genderTarget: "WOMEN", condition: "EXCELLENT", retailPrice: 6900, payoutPrice: 4100, pool: "womens" },
  { title: "Lace Blouse & Aso-Oke Skirt", description: "Delicate lace blouse paired with a handwoven Aso-Oke wrap skirt. Traditional meets contemporary.", category: "SKIRTS_BLOUSES", itemType: "Blouse & Skirt", size: "L", genderTarget: "WOMEN", condition: "GOOD", retailPrice: 8800, payoutPrice: 5300, pool: "lace" },
  { title: "Office Ankara Midi Skirt Set", description: "A-line Ankara midi skirt with a tucked blouse. Workwear with personality. Barely worn.", category: "SKIRTS_BLOUSES", itemType: "Skirt Set", size: "S", genderTarget: "WOMEN", condition: "EXCELLENT", retailPrice: 6200, payoutPrice: 3700, pool: "ankara" },

  // ── Traditional Wedding Attire ──
  { title: "Bridal Aso-Oke Complete Set", description: "Complete bridal Aso-Oke ensemble — iro, buba, gele and ipele — in champagne and gold. Worn once, professionally cleaned.", category: "TRADITIONAL_WEDDING_ATTIRE", itemType: "Bridal Set", size: "M", genderTarget: "WOMEN", condition: "EXCELLENT", retailPrice: 35000, payoutPrice: 22000, pool: "wedding" },
  { title: "Groom's Agbada Wedding Set", description: "Groom's complete wedding agbada with matching fila and beaded accessories. Rich, ceremonial, unforgettable.", category: "TRADITIONAL_WEDDING_ATTIRE", itemType: "Groom Set", size: "XL", genderTarget: "MEN", condition: "EXCELLENT", retailPrice: 32000, payoutPrice: 20000, pool: "wedding" },
  { title: "Coral-Beaded Edo Bridal Outfit", description: "Traditional Edo/Bini bridal outfit with authentic coral-bead detailing and red wrapper. A cultural statement.", category: "TRADITIONAL_WEDDING_ATTIRE", itemType: "Bridal Outfit", size: "M", genderTarget: "WOMEN", condition: "GOOD", retailPrice: 28000, payoutPrice: 17000, pool: "wedding" },

  // ── Accessories ──
  { title: "Sego Headtie Gele (2 yards)", description: "Premium Sego headtie for gele styling, in gold with shimmer. Holds shape beautifully. Brand new, never tied.", category: "ACCESSORIES", itemType: "Gele", size: "2 yards", genderTarget: "WOMEN", condition: "BRAND_NEW", retailPrice: 4500, payoutPrice: 2700, pool: "gele" },
  { title: "Coral Beads Necklace & Earring Set", description: "Traditional coral-bead jewellery set — necklace, bracelet and earrings. Perfect for weddings and chieftaincy.", category: "ACCESSORIES", itemType: "Bead Set", size: "One Size", genderTarget: "UNISEX", condition: "EXCELLENT", retailPrice: 6500, payoutPrice: 3900, pool: "gele" },
  { title: "Aso-Oke Fila Cap", description: "Handwoven Aso-Oke fila cap in etu indigo. The finishing touch for any traditional men's look.", category: "ACCESSORIES", itemType: "Fila Cap", size: "One Size", genderTarget: "MEN", condition: "GOOD", retailPrice: 3200, payoutPrice: 1900, pool: "gele" },
  { title: "Hand-Beaded Bridal Gele", description: "Pre-tied auto-gele with hand-beaded edging. Slips on in seconds for a flawless finish.", category: "ACCESSORIES", itemType: "Auto-Gele", size: "One Size", genderTarget: "WOMEN", condition: "BRAND_NEW", retailPrice: 5500, payoutPrice: 3300, pool: "gele" },

  // ── Shoes & Bags ──
  { title: "Beaded Bridal Clutch Purse", description: "Hand-beaded clutch in gold with a detachable chain strap. Roomy enough for the essentials. Bridal or owambe ready.", category: "SHOES_BAGS", itemType: "Clutch", size: "One Size", genderTarget: "WOMEN", condition: "EXCELLENT", retailPrice: 5800, payoutPrice: 3500, pool: "bags" },
  { title: "Ankara Print Tote Bag", description: "Sturdy canvas tote with a bold Ankara panel and leather handles. Everyday carry with flair.", category: "SHOES_BAGS", itemType: "Tote", size: "One Size", genderTarget: "UNISEX", condition: "GOOD", retailPrice: 3900, payoutPrice: 2300, pool: "bags" },
  { title: "Men's Leather Mule Slippers", description: "Handcrafted leather mule slippers in tan, with a cushioned footbed. Pairs perfectly with kaftans and agbada.", category: "SHOES_BAGS", itemType: "Slippers", size: "43", genderTarget: "MEN", condition: "EXCELLENT", retailPrice: 6200, payoutPrice: 3700, pool: "bags" },
  { title: "Raffia Woven Handbag", description: "Artisan raffia handbag with leather trim and a structured shape. Light, durable, and full of texture.", category: "SHOES_BAGS", itemType: "Handbag", size: "One Size", genderTarget: "WOMEN", condition: "BRAND_NEW", retailPrice: 4800, payoutPrice: 2900, pool: "bags" },

  // ── Pre-Loved / Thrifted ──
  { title: "Pre-Loved Ankara Maxi Dress", description: "Gently-worn Ankara maxi in great condition. A few washes in, colours still vibrant. Sustainable style win.", category: "PRELOVED_THRIFTED", itemType: "Maxi Dress", size: "M", genderTarget: "WOMEN", condition: "GOOD", retailPrice: 3500, payoutPrice: 2000, pool: "ankara" },
  { title: "Thrifted Adire Kaftan", description: "Vintage Adire kaftan with beautiful fade and character. Soft from years of love. One-of-a-kind thrift find.", category: "PRELOVED_THRIFTED", itemType: "Kaftan", size: "L", genderTarget: "UNISEX", condition: "FAIR", retailPrice: 2800, payoutPrice: 1600, pool: "adire" },
  { title: "Gently-Used Lace Gown", description: "Pre-owned lace gown, worn twice to events. Minor loose beading, otherwise excellent. Huge saving on retail.", category: "PRELOVED_THRIFTED", itemType: "Gown", size: "S", genderTarget: "WOMEN", condition: "GOOD", retailPrice: 5500, payoutPrice: 3300, pool: "lace" },
];

async function main() {
  console.log("🌍  Seeding African-wear catalogue...\n");

  const seller = await db.user.findUnique({ where: { email: "seller@thread.com" }, include: { sellerProfile: true } });
  const admin = await db.user.findUnique({ where: { email: "admin@thread.com" }, include: { adminProfile: true } });
  if (!seller?.sellerProfile) throw new Error("Run seed.ts first (seller account missing)");
  if (!admin?.adminProfile) throw new Error("Run seed.ts first (admin account missing)");
  const sellerId = seller.sellerProfile.id;
  const adminId = admin.adminProfile.id;

  // Clear the existing catalogue (and anything referencing it) for a clean replace.
  await db.review.deleteMany({});
  await db.payout.deleteMany({});
  await db.orderItem.deleteMany({});
  await db.order.deleteMany({});
  await db.item.deleteMany({});
  await db.submission.deleteMany({});
  console.log("🧹  Cleared previous items.\n");

  let count = 0;
  for (const it of ITEMS) {
    const photos = pics(it.pool, 3);
    const submission = await db.submission.create({
      data: {
        sellerId,
        category: it.category as never,
        itemType: it.itemType,
        brand: it.brand,
        size: it.size,
        genderTarget: it.genderTarget as never,
        condition: it.condition as never,
        photos,
        sellerDescription: it.description,
        adminDescription: it.description,
        desiredPayoutPrice: it.payoutPrice,
        agreedPayoutPrice: it.payoutPrice,
        retailPrice: it.retailPrice,
        status: "LIVE",
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });
    await db.item.create({
      data: {
        submissionId: submission.id,
        slug: slug(it.title, count + 1),
        title: it.title,
        description: it.description,
        category: it.category as never,
        itemType: it.itemType,
        brand: it.brand,
        size: it.size,
        genderTarget: it.genderTarget as never,
        condition: it.condition as never,
        photos,
        retailPrice: it.retailPrice,
        agreedPayoutPrice: it.payoutPrice,
        isLive: true,
        publishedAt: new Date(),
      },
    });
    count++;
    process.stdout.write(`  ✅  [${count}/${ITEMS.length}] ${it.title}\n`);
  }

  console.log(`\n🎉  Done! ${count} African-wear items are now live across all categories.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
