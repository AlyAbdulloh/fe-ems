export interface UserRoleItem {
  role: {
    name: string;
  };
}

export interface OrganizerProfile {
  id: string;
  userId?: string;
  organizationName: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  isActive?: boolean;
  roles?: UserRoleItem[];
  organizer?: OrganizerProfile | null;
  createdAt?: string;
  updatedAt?: string;
}
