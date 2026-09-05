export interface UserProfile {
  id: string;
  email: string;
  role: "STUDENT" | "FACULTY" | "ADMIN" | "ALUMNI";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";
  email_verified: boolean;
  created_at: string;
  last_login_at?: string | null;
  profile_completed: boolean;
}

export interface ProfileData {
  id: string;
  user_id: string;
  full_name: string;
  profile_photo_url?: string | null;
  department?: string | null;
  year?: number | null;
  designation?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  searchable: boolean;
  contact_visibility: "PUBLIC" | "CONNECTIONS_ONLY" | "PRIVATE";
  show_email: boolean;
  show_phone: boolean;
  show_social_links: boolean;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface HealthStatus {
  status: string;
  database?: string;
  pgvector?: string;
  postgres_version?: string;
}
