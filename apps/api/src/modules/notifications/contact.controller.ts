import { Controller, Post, Body, HttpCode } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { Public } from "../../common/decorators/public.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  subject: z.string().min(1).max(120),
  message: z.string().min(10).max(5000),
});

type ContactDto = z.infer<typeof ContactSchema>;

@Controller("contact")
export class ContactController {
  constructor(private readonly notifications: NotificationsService) {}

  @Public()
  @Post()
  @HttpCode(202)
  async send(@Body(new ZodValidationPipe(ContactSchema)) dto: ContactDto) {
    await this.notifications.sendContactMessage(dto);
    return { data: { ok: true } };
  }
}
