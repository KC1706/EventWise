import { logger } from './logger';
import { NextResponse } from 'next/server';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): NextResponse {
  // Log the error
  if (error instanceof AppError) {
    logger.error(`AppError: ${error.message}`, undefined, {
      statusCode: error.statusCode,
      code: error.code,
      details: error.details,
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && error.details && { details: error.details }),
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    logger.error('Unexpected error', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { message: error.message }),
      },
      { status: 500 }
    );
  }

  logger.error('Unknown error', new Error(String(error)));
  return NextResponse.json(
    { error: 'An unknown error occurred' },
    { status: 500 }
  );
}

export function createError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: Record<string, any>
): AppError {
  return new AppError(message, statusCode, code, details);
}
