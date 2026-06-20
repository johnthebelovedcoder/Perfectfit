import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const REVIEWS = [
  { buyerName: "Sarah M.", rating: 5, title: "Absolutely love it!", body: "The quality exceeded my expectations. Arrived quickly and the condition was exactly as described. Will definitely buy from Perfect Fit again." },
  { buyerName: "James T.", rating: 4, title: "Great find", body: "Really happy with this purchase. Fit perfectly and the price was unbeatable. Minor scuff I didn't notice in photos but honestly barely visible." },
  { buyerName: "Priya K.", rating: 5, title: "Verified quality 👌", body: "I was skeptical buying second-hand online but the inspection process is legit. Item came perfectly packaged. Looks brand new." },
  { buyerName: "Marcus D.", rating: 3, title: "Good but sizing runs small", body: "Item is in great condition as described. Just wish the sizing info was more detailed. I had to exchange. Customer service was helpful though." },
  { buyerName: "Lisa W.", rating: 5, title: "10/10 would shop again", body: "Honestly the best thrift shopping experience I've had online. Everything is exactly as pictured and ships fast. Love the curation." },
  { buyerName: "Tom A.", rating: 4, title: "Solid purchase", body: "Happy with the quality and the price. The photos on the listing were accurate. Came in nice packaging too." },
  { buyerName: "Aisha B.", rating: 5, title: "Perfect condition!", body: "You genuinely cannot tell this is a thrift item. It smells fresh, looks pristine. Really impressive quality control from the team." },
  { buyerName: "Carlos R.", rating: 2, title: "Not quite what I expected", body: "The item was described as excellent condition but there was more fading than I expected. Would rate the condition as good at best. Still keeping it." },
  { buyerName: "Emma J.", rating: 5, title: "My new favourite marketplace", body: "I've bought three things from Perfect Fit now and every single one has been excellent. The curation is fantastic and delivery is always fast." },
  { buyerName: "David N.", rating: 4, title: "Great value", body: "Paid a fraction of retail for something in near-perfect condition. The verification process gives you real confidence when buying." },
];

async function main() {
  console.log("🌱 Seeding reviews...");

  // Get all live items
  const items = await db.item.findMany({
    where: { isLive: true },
    select: { id: true, title: true },
    take: 20,
  });

  if (items.length === 0) {
    console.log("No live items found. Run seed-items.ts first.");
    return;
  }

  let count = 0;

  // Add 2-4 reviews to the first 15 items
  for (let i = 0; i < Math.min(items.length, 15); i++) {
    const item = items[i]!;
    // Pick 2-4 random reviews for each item
    const numReviews = 2 + (i % 3);
    const startIdx = (i * 2) % REVIEWS.length;

    for (let j = 0; j < numReviews; j++) {
      const review = REVIEWS[(startIdx + j) % REVIEWS.length]!;
      await db.review.create({
        data: {
          itemId: item.id,
          rating: review.rating,
          title: review.title,
          body: review.body,
          buyerName: review.buyerName,
          verified: j === 0, // first reviewer is "verified purchaser"
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      });
      count++;
    }
    process.stdout.write(`  ✅ [${i + 1}/${Math.min(items.length, 15)}] ${item.title}\n`);
  }

  console.log(`\n🎉 Created ${count} reviews across ${Math.min(items.length, 15)} items.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
