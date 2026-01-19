import type { UserProfile } from './firestore-types';

export type UserRole = 'attendee' | 'organizer' | 'speaker' | 'sponsor' | 'admin';

export interface Permission {
  resource: string;
  action: string;
}

// Define permissions for each role
const rolePermissions: Record<UserRole, Permission[]> = {
  attendee: [
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'agenda', action: 'read' },
    { resource: 'agenda', action: 'create' },
    { resource: 'agenda', action: 'update' },
    { resource: 'matchmaking', action: 'read' },
    { resource: 'tickets', action: 'purchase' },
    { resource: 'tickets', action: 'read' },
  ],
  organizer: [
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'events', action: 'create' },
    { resource: 'events', action: 'read' },
    { resource: 'events', action: 'update' },
    { resource: 'events', action: 'delete' },
    { resource: 'sessions', action: 'create' },
    { resource: 'sessions', action: 'read' },
    { resource: 'sessions', action: 'update' },
    { resource: 'sessions', action: 'delete' },
    { resource: 'dashboard', action: 'read' },
    { resource: 'attendees', action: 'read' },
    { resource: 'sponsors', action: 'create' },
    { resource: 'sponsors', action: 'read' },
    { resource: 'sponsors', action: 'update' },
    { resource: 'sponsors', action: 'delete' },
  ],
  speaker: [
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'sessions', action: 'read' },
    { resource: 'sessions', action: 'update' }, // Only their own sessions
  ],
  sponsor: [
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'sponsors', action: 'read' },
    { resource: 'sponsors', action: 'update' }, // Only their own sponsor profile
  ],
  admin: [
    // Admins have all permissions
    { resource: '*', action: '*' },
  ],
};

export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: string
): boolean {
  const permissions = rolePermissions[userRole] || rolePermissions.attendee;

  // Admin has all permissions
  if (userRole === 'admin') {
    return true;
  }

  // Check for exact match
  const hasExact = permissions.some(
    (p) => p.resource === resource && p.action === action
  );

  if (hasExact) {
    return true;
  }

  // Check for wildcard permissions
  const hasWildcard = permissions.some(
    (p) => p.resource === '*' || (p.resource === resource && p.action === '*')
  );

  return hasWildcard;
}

export function requirePermission(
  userRole: UserRole,
  resource: string,
  action: string
): void {
  if (!hasPermission(userRole, resource, action)) {
    throw new Error(
      `User with role '${userRole}' does not have permission to ${action} ${resource}`
    );
  }
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Define route access rules
  const routePermissions: Record<string, UserRole[]> = {
    '/organizer': ['organizer', 'admin'],
    '/dashboard': ['organizer', 'admin'],
    '/admin': ['admin'],
  };

  // Check if route has specific permissions
  for (const [routePattern, allowedRoles] of Object.entries(routePermissions)) {
    if (route.startsWith(routePattern)) {
      return allowedRoles.includes(userRole);
    }
  }

  // Default: all authenticated users can access
  return true;
}

export function getRoleFromUser(user: UserProfile | null): UserRole {
  return user?.role || 'attendee';
}
