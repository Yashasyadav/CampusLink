export interface HealthStatus {
  status: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "student" | "faculty" | "researcher" | "admin";
}
