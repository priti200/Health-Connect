export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR';
  avatar?: string;
  
  // Doctor-specific fields
  specialization?: string;
  licenseNumber?: string;
  affiliation?: string;
  yearsOfExperience?: number;
  
  // Common fields
  phoneNumber?: string;
  address?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'PATIENT' | 'DOCTOR';
  
  // Doctor-specific fields
  specialization?: string;
  licenseNumber?: string;
  affiliation?: string;
  yearsOfExperience?: number;
  
  // Common fields
  phoneNumber?: string;
  address?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  id: number;
  fullName: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR';
  token: string;
  avatar?: string;
  
  // Doctor-specific fields
  specialization?: string;
  licenseNumber?: string;
  affiliation?: string;
  yearsOfExperience?: number;
  
  // Common fields
  phoneNumber?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  message?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  specialization?: string;
  affiliation?: string;
  yearsOfExperience?: number;
  phoneNumber?: string;
  address?: string;
  avatar?: string;
}
