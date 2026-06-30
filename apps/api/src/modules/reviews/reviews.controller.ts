import { Controller, Get, Post, Body, Param, UseGuards, HttpCode } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { z } from "zod";

const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(1000),
  buyerName: z.string().min(2).max(80),
  buyerEmail: z.string().email(),
});

type CreateReviewDto = z.infer<typeof CreateReviewSchema>;

@Controller("items/:slug/reviews")
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  async getReviews(@Param("slug") slug: string) {
    const result = await this.reviewsService.getReviews(slug);
    return { data: result };
  }

  // @Public so guest buyers (no account) can review, but the service enforces
  // that the buyerEmail has a paid order containing this item (verified purchase).
  @Public()
  @Post()
  @HttpCode(201)
  async createReview(
    @Param("slug") slug: string,
    @Body(new ZodValidationPipe(CreateReviewSchema)) dto: CreateReviewDto,
  ) {
    const review = await this.reviewsService.createReview(slug, dto);
    return { data: review };
  }
}
