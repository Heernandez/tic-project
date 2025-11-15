export type ReportStatus = "nuevo" | "en_progreso" | "reasignado" | "finalizado";

export interface ReportMedia {
  id: number;
  file_name: string;
  media_type: string; // "image" | "video"
  order: number;
}

export interface ReportCommentMedia {
  id: number;
  file_name: string;
  media_type: string;
  order: number;
}

export interface ReportComment {
  id: number;
  author?: string | null;
  content: string;
  created_at: string;
  media: ReportCommentMedia[];
}

export interface Report {
  id: number;
  public_id: string;
  citizen_email?: string | null;
  latitude: number;
  longitude: number;
  description: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  media: ReportMedia[];
  comments: ReportComment[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string; // "bearer"
  username: string;
}