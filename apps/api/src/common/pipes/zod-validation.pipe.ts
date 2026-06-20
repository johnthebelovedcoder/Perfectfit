import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import type { ZodSchema, ZodError } from "zod";

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const error = result.error as ZodError;
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }
    return result.data;
  }
}
