import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";

interface CreateReviewDto {
  rating: number;
  title?: string;
  body: string;
  buyerName: string;
  buyerEmail: string;
}

@Injectable()
export class ReviewsService {
  constructor(private db: DatabaseService) {}

  async getReviews(slug: string) {
    const item = await this.db.item.findUnique({
      where: { slug, isLive: true },
      select: { id: true },
    });
    if (!item) throw new NotFoundException("Item not found");

    const reviews = await this.db.review.findMany({
      where: { itemId: item.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        buyerName: true,
        verified: true,
        createdAt: true,
      },
    });

    // Compute aggregate stats
    const count = reviews.length;
    const average =
      count > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
        : 0;

    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) breakdown[r.rating] = (breakdown[r.rating] ?? 0) + 1;

    return { reviews, stats: { count, average, breakdown } };
  }

  async createReview(slug: string, dto: CreateReviewDto) {
    const item = await this.db.item.findUnique({
      where: { slug, isLive: true },
      select: { id: true },
    });
    if (!item) throw new NotFoundException("Item not found");

    // Only verified buyers can review: require a paid order for this email
    // that contains the item.
    const purchase = await this.db.order.findFirst({
      where: {
        paymentStatus: "PAID",
        OR: [{ email: dto.buyerEmail }, { guestEmail: dto.buyerEmail }],
        orderItems: { some: { itemId: item.id } },
      },
      select: { id: true },
    });
    if (!purchase) {
      throw new BadRequestException(
        "Only verified buyers can leave a review. Use the email address from your order.",
      );
    }

    const prior = await this.db.review.findFirst({
      where: { itemId: item.id, buyerEmail: dto.buyerEmail },
      select: { id: true },
    });
    if (prior) throw new BadRequestException("You have already reviewed this item");

    return this.db.review.create({
      data: {
        itemId: item.id,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        buyerName: dto.buyerName,
        buyerEmail: dto.buyerEmail,
        verified: true,
      },
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        buyerName: true,
        verified: true,
        createdAt: true,
      },
    });
  }
}
