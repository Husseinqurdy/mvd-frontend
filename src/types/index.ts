import type { ReactNode } from "react";

export type Role = 'ADMIN' | 'CLASS_REP' | 'LECTURER'

export interface AuthUser {
  user_id: number; email: string; full_name: string
  role: Role; department?: string
}

export interface User {
  id: number; email: string; full_name: string
  role: Role; department: string; phone: string
  is_active: boolean; date_joined: string
}

export interface Building {
  id: number; name: string; code: string
  location: string; venue_count: number
}

export interface Venue {
  has_projector: any;
  floor: ReactNode;
  id: number; building: number; building_name: string
  name: string; code: string; venue_type: string
  venue_type_display: string; capacity: number
  wing: string; is_active: boolean
}

export interface SessionInfo {
  type: string; course_code: string; course_name: string
  lecturer: string; program: string; year: number | string
  start_time: string; end_time: string; group: string
}

export interface VenueStatus {
  venue_id: number; venue_code: string; venue_name: string
  building: string; capacity: number; venue_type: string
  status: 'OCCUPIED' | 'AVAILABLE'
  current_session: SessionInfo | null
  next_session: SessionInfo | null
  evaluated_at: string
}

export interface AcademicPeriod {
  id: number; name: string; start_date: string
  end_date: string; is_active: boolean
}

export interface TimetableSession {
  id: number; period: number; program: number | null
  program_name: string | null; year_of_study: number
  course_code: string; course_name: string; lecturer_name: string
  lecturer: number | null; venue: number; venue_code: string
  venue_name: string; building: string; day_of_week: number
  day_display: string; start_time: string; end_time: string
  group: string; is_cross_cutting: boolean; is_active: boolean
  import_source: string
}

export interface VenueRequest {
  id: number; venue: number; venue_code: string
  venue_name: string; building_name: string; capacity: number
  requested_by: number; requested_by_name: string
  reviewed_by: number | null; reviewed_by_name: string | null
  purpose: string; date: string; start_time: string
  end_time: string; attendees: number; status: 'PENDING' | 'APPROVED' | 'REJECTED'
  admin_note: string; created_at: string; updated_at: string
}

export interface Program {
  id: number; name: string; code: string; level: string
  uqf_level: number; duration_years: number
  department: number; department_name: string; college_name: string
}

export interface ImportLog {
  id: number; source: string; filename: string; status: string
  sessions_created: number; sessions_skipped: number
  venues_created: number; errors: string
  imported_by_name: string; period_name: string; created_at: string
}
