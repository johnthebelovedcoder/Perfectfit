import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from "@nestjs/common";
import { SubmissionsService } from "./submissions.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { z } from "zod";
import {
  CreateSubmissionSchema,
  UpdateSubmissionSchema,
  ReviewSubmissionSchema,
  SellerNegotiationResponseSchema,
} from "@thread/types";
import type {
  CreateSubmission,
  UpdateSubmission,
  ReviewSubmission,
  SellerNegotiationResponse,
  SessionUser,
} from "@thread/types";

const InfoResponseSchema = z.object({
  additionalInfo: z.string().min(1, "Response is required").max(2000),
});

@Controller("submissions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  @Post()
  @Roles("SELLER")
  async create(
    @Body(new ZodValidationPipe(CreateSubmissionSchema)) dto: CreateSubmission,
    @CurrentUser() user: SessionUser
  ) {
    const data = await this.submissionsService.create(dto, user);
    return { data };
  }

  @Get("mine")
  @Roles("SELLER")
  async findMy(
    @CurrentUser() user: SessionUser,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number
  ) {
    const result = await this.submissionsService.findMy(user, page, limit);
    return { data: result.items, meta: { total: result.total, hasMore: (page - 1) * limit + result.items.length < result.total, limit } };
  }

  @Get("queue")
  @Roles("ADMIN")
  async getQueue(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("status") status?: string
  ) {
    const result = await this.submissionsService.findReviewQueue(page, limit, status);
    return { data: result.items, meta: { total: result.total, hasMore: (page - 1) * limit + result.items.length < result.total, limit } };
  }

  @Get(":id")
  @Roles("SELLER", "ADMIN")
  async findOne(@Param("id") id: string, @CurrentUser() user: SessionUser) {
    const data = await this.submissionsService.findById(id, user);
    return { data };
  }

  @Patch(":id")
  @Roles("SELLER")
  async updateMine(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateSubmissionSchema)) dto: UpdateSubmission,
    @CurrentUser() user: SessionUser
  ) {
    const data = await this.submissionsService.updateSubmission(id, dto, user);
    return { data };
  }

  @Patch(":id/review")
  @Roles("ADMIN")
  async review(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(ReviewSubmissionSchema)) dto: ReviewSubmission,
    @CurrentUser() admin: SessionUser
  ) {
    const data = await this.submissionsService.review(id, dto, admin);
    return { data };
  }

  @Patch(":id/negotiate")
  @Roles("SELLER")
  async respondToNegotiation(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(SellerNegotiationResponseSchema)) dto: SellerNegotiationResponse,
    @CurrentUser() user: SessionUser
  ) {
    const data = await this.submissionsService.respondToNegotiation(id, dto, user);
    return { data };
  }

  @Patch(":id/ship")
  @Roles("SELLER")
  async markShipped(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser
  ) {
    const data = await this.submissionsService.markShipped(id, user);
    return { data };
  }

  @Patch(":id/info-response")
  @Roles("SELLER")
  async respondToMoreInfo(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(InfoResponseSchema)) body: { additionalInfo: string },
    @CurrentUser() user: SessionUser
  ) {
    const data = await this.submissionsService.respondToMoreInfo(id, body.additionalInfo, user);
    return { data };
  }

  @Patch(":id/received")
  @Roles("ADMIN")
  async markReceived(@Param("id") id: string) {
    const data = await this.submissionsService.markReceived(id);
    return { data };
  }
}
