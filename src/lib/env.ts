/**
 * Environment variable validation and type-safe access
 */

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

// Firebase configuration
export const env = {
  // Firebase (required)
  firebase: {
    apiKey: getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: getEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnvVar('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID'),
  },

  // Google AI (required for AI features)
  googleAI: {
    apiKey: getEnvVar('GOOGLE_AI_API_KEY'),
  },

  // Stripe (required for payments)
  stripe: {
    publishableKey: getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    secretKey: getEnvVar('STRIPE_SECRET_KEY'),
    webhookSecret: getOptionalEnvVar('STRIPE_WEBHOOK_SECRET'),
  },

  // App configuration
  app: {
    url: getOptionalEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:9002'),
    nodeEnv: getOptionalEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  },

  // Optional Firebase Service Account (for server-side admin)
  firebaseServiceAccount: getOptionalEnvVar('FIREBASE_SERVICE_ACCOUNT'),
} as const;

// Validation function to check all required env vars are set
export function validateEnv() {
  try {
    // This will throw if any required vars are missing
    const _ = env;
    return { valid: true, errors: [] };
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// Type-safe environment access
export default env;
