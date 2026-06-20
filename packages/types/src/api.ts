import { z } from "zod";

export const PaginationMetaSchema = z.object({
  total: z.number().int().optional(),
  nextCursor: z.string().nullable().optional(),
  hasMore: z.boolean(),
  limit: z.number().int(),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export type ApiSuccess<T> = {
  data: T;
  meta?: PaginationMeta;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function isApiError(res: ApiResponse<unknown>): res is ApiError {
  return "error" in res;
}
