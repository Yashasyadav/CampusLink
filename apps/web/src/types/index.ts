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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ProjectContributor {
  id: string;
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  role: "OWNER" | "DEVELOPER" | "RESEARCHER" | "DESIGNER" | "FACULTY_GUIDE" | "MENTOR" | "CONTRIBUTOR";
  contribution_description?: string | null;
}

export interface ProjectSkill {
  skill_id: string;
  name: string;
  category?: string | null;
}

export interface ProjectTechnology {
  name: string;
  normalized_name: string;
  category?: string | null;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  project_type: "ACADEMIC" | "RESEARCH" | "CAPSTONE" | "ENTREPRENEURIAL" | "OPEN_SOURCE" | "PERSONAL";
  domain?: string | null;
  problem_statement?: string | null;
  methodology?: string | null;
  outcome?: string | null;
  visibility: "PUBLIC" | "CAMPUS_ONLY" | "PRIVATE";
  status: "PROPOSED" | "IN_PROGRESS" | "COMPLETED" | "PAUSED" | "ARCHIVED";
  provenance: string;
  start_date?: string | null;
  end_date?: string | null;
  github_url?: string | null;
  demo_url?: string | null;
  paper_url?: string | null;
  video_url?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  creator_name?: string | null;
  skills: ProjectSkill[];
  technologies: ProjectTechnology[];
  contributors: ProjectContributor[];
}

export interface ResearchAuthor {
  id: string;
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  author_order: number;
}

export interface ResearchItem {
  id: string;
  owner_id: string;
  owner_name?: string | null;
  title: string;
  abstract?: string | null;
  research_area?: string | null;
  publication_type: "JOURNAL" | "JOURNAL_ARTICLE" | "CONFERENCE" | "WORKSHOP" | "THESIS" | "DISSERTATION" | "PREPRINT" | "TECHNICAL_REPORT" | "OTHER";
  publication_venue?: string | null;
  publication_date?: string | null;
  doi?: string | null;
  publication_url?: string | null;
  paper_url?: string | null;
  status: "DRAFT" | "SUBMITTED" | "PUBLISHED";
  visibility: "PUBLIC" | "CAMPUS_ONLY" | "PRIVATE";
  provenance: string;
  created_at: string;
  updated_at: string;
  authors: ResearchAuthor[];
}

export interface EquipmentBrief {
  id: string;
  name: string;
  category?: string | null;
  quantity: number;
  status: string;
  availability_status: string;
}

export interface Facility {
  id: string;
  name: string;
  facility_type: string;
  location: string;
  building?: string | null;
  floor?: string | null;
  department?: string | null;
  contact_email?: string | null;
  operating_hours?: string | null;
  description?: string | null;
  capabilities?: string | null;
  responsible_user_id?: string | null;
  responsible_user_name?: string | null;
  status: "OPERATIONAL" | "MAINTENANCE" | "RESTRICTED";
  availability_notes?: string | null;
  visibility: "PUBLIC" | "CAMPUS_ONLY" | "PRIVATE";
  created_at: string;
  updated_at: string;
  equipment_count: number;
  equipment: EquipmentBrief[];
}

export interface Equipment {
  id: string;
  facility_id: string;
  facility_name?: string | null;
  name: string;
  category?: string | null;
  description?: string | null;
  capability?: string | null;
  quantity: number;
  status: "OPERATIONAL" | "UNDER_REPAIR" | "DECOMMISSIONED";
  availability_status: "AVAILABLE" | "RESERVED" | "IN_USE";
  visibility: "PUBLIC" | "CAMPUS_ONLY" | "PRIVATE";
  created_at: string;
  updated_at: string;
}

export interface ProblemSolutionSkill {
  skill_id: string;
  name: string;
}

export interface ProblemSolutionTech {
  name: string;
  normalized_name: string;
}

export interface ProblemSolution {
  id: string;
  author_id?: string | null;
  author_name?: string | null;
  project_id?: string | null;
  project_title?: string | null;
  research_id?: string | null;
  research_title?: string | null;
  title: string;
  problem: string;
  symptoms?: string | null;
  root_cause?: string | null;
  solution: string;
  outcome?: string | null;
  lessons_learned?: string | null;
  domain?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  visibility: "PUBLIC" | "CAMPUS_ONLY" | "PRIVATE";
  provenance: string;
  created_at: string;
  updated_at: string;
  skills: ProblemSolutionSkill[];
  technologies: ProblemSolutionTech[];
}
