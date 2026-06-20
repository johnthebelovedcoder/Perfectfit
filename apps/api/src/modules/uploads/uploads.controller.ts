import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { UploadsService } from "./uploads.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("uploads")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Get("sign")
  @Roles("SELLER", "ADMIN")
  getSignature(@Query("folder") folder: "submissions" | "items" = "submissions") {
    const data = this.uploadsService.generateUploadSignature(folder);
    return { data };
  }
}
