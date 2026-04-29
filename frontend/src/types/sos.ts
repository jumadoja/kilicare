export type SOSSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SOSStatus = 'ACTIVE' | 'RESPONDING' | 'RESOLVED' | 'CANCELLED';

export interface SOSAlert {
  id: number;
  user_info: { id: number; username: string; role: string };
  latitude: number;
  longitude: number;
  location_address: string | null;
  severity: SOSSeverity;
  status: SOSStatus;
  message: string;
  responder_count: number;
  responses: SOSResponse[];
  is_responded_by_current_user: boolean;
  created_at: string;
  resolved_at: string | null;
}

export interface SOSResponse {
  id: number;
  responder: { id: number; username: string; avatar: string | null };
  message: string;
  is_onsite: boolean;
  created_at: string;
}

export interface CreateSOSPayload {
  latitude: number;
  longitude: number;
  severity: SOSSeverity;
  message?: string;
}