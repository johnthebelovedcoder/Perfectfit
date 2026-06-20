import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import * as Sentry from "@sentry/node";
import type { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let code = "INTERNAL_SERVER_ERROR";
    let message = "An unexpected error occurred";
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        code = (res["code"] as string) ?? exception.constructor.name;
        message = (res["message"] as string) ?? exception.message;
        details = res["details"];
      } else {
        message = exception.message;
      }
    }

    // Log 5xx errors to stdout and report them to Sentry (no-op if SENTRY_DSN unset).
    if (status >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag("path", request.url);
        scope.setTag("method", request.method);
        Sentry.captureException(exception);
      });
      // eslint-disable-next-line no-console -- intentional server error log
      console.error({
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        status,
        error: exception instanceof Error ? exception.stack : exception,
      });
    }

    response.status(status).json({
      error: { code, message, details },
    });
  }
}
