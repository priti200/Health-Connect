export interface UserSummary {
  id: number;
  fullName: string;
  email: string;
  specialization?: string;
  affiliation?: string;
}

export interface Appointment {
  id: number;
  doctor: UserSummary;
  patient: UserSummary;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: AppointmentType;
  reasonForVisit?: string;
  notes?: string;
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum AppointmentType {
  IN_PERSON = 'IN_PERSON',
  VIDEO_CALL = 'VIDEO_CALL'
}

export interface AppointmentRequest {
  doctorId: number;
  date: string;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  reasonForVisit?: string;
  notes?: string;
}

export interface AppointmentUpdateRequest {
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
  reasonForVisit?: string;
  notes?: string;
  meetingLink?: string;
}

export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Doctor {
  id: number;
  fullName: string;
  email: string;
  specialization?: string;
  affiliation?: string;
  yearsOfExperience?: number;
  avatar?: string;
}
