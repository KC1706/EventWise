/**
 * @deprecated This file is deprecated. Use Firestore service layer instead.
 * See src/lib/firestore-service.ts for the new implementation.
 * 
 * This file is kept for backward compatibility during migration.
 * All new code should use the Firestore service layer.
 */

// This file is intentionally left empty as we've migrated to Firestore.
// The openDb function is no longer used.
// If you need database operations, use the services from src/lib/firestore-service.ts

export async function openDb() {
  throw new Error(
    'SQLite database is deprecated. Please use Firestore service layer from src/lib/firestore-service.ts'
  );
}
