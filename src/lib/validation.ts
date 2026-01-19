import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password must be less than 100 characters');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters');

export const urlSchema = z.string().url('Must be a valid URL').optional().or(z.literal(''));

export const eventIdSchema = z.string().min(1, 'Event ID is required');

export const userIdSchema = z.string().min(1, 'User ID is required');

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .slice(0, 10000); // Limit length
}

// Validate and sanitize
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      // If data is a string, sanitize it
      if (typeof result.data === 'string') {
        return { success: true, data: sanitizeInput(result.data) as T };
      }
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.errors[0]?.message || 'Validation failed' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation error',
    };
  }
}
