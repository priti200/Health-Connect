import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DigitalPrescription {
  id: number;
  prescriptionNumber: string;
  doctor: any;
  patient: any;
  appointment?: any;
  consultation?: any;
  status: 'DRAFT' | 'ISSUED' | 'SENT_TO_PHARMACY' | 'PARTIALLY_DISPENSED' | 'FULLY_DISPENSED' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
  type: 'ACUTE' | 'CHRONIC' | 'REPEAT' | 'EMERGENCY' | 'CONTROLLED_SUBSTANCE' | 'OVER_THE_COUNTER' | 'SPECIALIST_PRESCRIPTION';
  issueDate: string;
  expiryDate?: string;
  validUntil?: string;
  diagnosis?: string;
  symptoms?: string;
  instructions?: string;
  warnings?: string;
  notes?: string;
  refillsAllowed: number;
  refillsRemaining: number;
  pharmacyName?: string;
  pharmacyAddress?: string;
  pharmacyPhone?: string;
  digitalSignature?: string;
  verificationCode?: string;
  qrCode?: string;
  dispensedDate?: string;
  dispensedBy?: string;
  dispensedPharmacy?: string;
  insuranceApproved: boolean;
  insuranceClaimNumber?: string;
  totalCost?: number;
  patientCost?: number;
  insuranceCoverage?: number;
  medications: PrescriptionMedication[];
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionMedication {
  id: number;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  strength: string;
  dosageForm: string;
  quantity: number;
  unit: string;
  dosageInstructions: string;
  frequency: string;
  duration: string;
  routeOfAdministration: string;
  specialInstructions?: string;
  sideEffects?: string;
  contraindications?: string;
  drugInteractions?: string;
  foodInteractions?: string;
  storageInstructions?: string;
  ndcNumber?: string;
  rxcui?: string;
  deaSchedule?: string;
  status: 'PRESCRIBED' | 'PENDING_APPROVAL' | 'APPROVED' | 'DISPENSED' | 'PARTIALLY_DISPENSED' | 'DISCONTINUED' | 'SUBSTITUTED' | 'REJECTED';
  substitutionAllowed: boolean;
  priorAuthorizationRequired: boolean;
  priorAuthorizationNumber?: string;
  costEstimate?: number;
  insuranceCoveragePercentage?: number;
  patientCopay?: number;
  dispensedQuantity?: number;
  remainingQuantity?: number;
  lastDispensedDate?: string;
  nextRefillDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionRequest {
  patientId: number;
  appointmentId?: number;
  consultationId?: number;
  type: string;
  diagnosis: string;
  symptoms?: string;
  instructions?: string;
  warnings?: string;
  notes?: string;
  refillsAllowed: number;
  pharmacyName?: string;
  pharmacyAddress?: string;
  pharmacyPhone?: string;
  medications: MedicationRequest[];
}

export interface MedicationRequest {
  medicationName: string;
  genericName?: string;
  brandName?: string;
  strength: string;
  dosageForm: string;
  quantity: number;
  unit: string;
  dosageInstructions: string;
  frequency: string;
  duration: string;
  routeOfAdministration: string;
  specialInstructions?: string;
  sideEffects?: string;
  contraindications?: string;
  drugInteractions?: string;
  foodInteractions?: string;
  storageInstructions?: string;
  substitutionAllowed: boolean;
  priorAuthorizationRequired: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DigitalPrescriptionService {
  private apiUrl = `${environment.apiUrl}/digital-prescription`;
  private currentPrescription$ = new BehaviorSubject<DigitalPrescription | null>(null);

  constructor(private http: HttpClient) {}

  // Create prescription
  createPrescription(request: PrescriptionRequest): Observable<DigitalPrescription> {
    return this.http.post<DigitalPrescription>(`${this.apiUrl}/create`, request);
  }

  // Get prescription by ID
  getPrescription(prescriptionId: number): Observable<DigitalPrescription> {
    return this.http.get<DigitalPrescription>(`${this.apiUrl}/${prescriptionId}`);
  }

  // Get prescription by number
  getPrescriptionByNumber(prescriptionNumber: string): Observable<DigitalPrescription> {
    return this.http.get<DigitalPrescription>(`${this.apiUrl}/number/${prescriptionNumber}`);
  }

  // Get doctor prescriptions (paginated)
  getDoctorPrescriptions(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/doctor/prescriptions?page=${page}&size=${size}`);
  }

  // Get patient prescriptions (paginated)
  getPatientPrescriptions(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/patient/prescriptions?page=${page}&size=${size}`);
  }

  // Get active prescriptions
  getActivePrescriptions(): Observable<DigitalPrescription[]> {
    return this.http.get<DigitalPrescription[]>(`${this.apiUrl}/patient/active`);
  }

  // Get expiring prescriptions
  getExpiringPrescriptions(daysAhead: number = 7): Observable<DigitalPrescription[]> {
    return this.http.get<DigitalPrescription[]>(`${this.apiUrl}/patient/expiring?daysAhead=${daysAhead}`);
  }

  // Issue prescription (for doctors)
  issuePrescription(prescriptionId: number): Observable<DigitalPrescription> {
    return this.http.post<DigitalPrescription>(`${this.apiUrl}/${prescriptionId}/issue`, {});
  }

  // Update prescription status
  updatePrescriptionStatus(prescriptionId: number, status: string): Observable<DigitalPrescription> {
    return this.http.put<DigitalPrescription>(`${this.apiUrl}/${prescriptionId}/status`, { status });
  }

  // Send prescription to pharmacy
  sendToPharmacy(prescriptionId: number, pharmacyInfo: any): Observable<DigitalPrescription> {
    return this.http.post<DigitalPrescription>(`${this.apiUrl}/${prescriptionId}/send-to-pharmacy`, pharmacyInfo);
  }

  // Request refill
  requestRefill(prescriptionId: number): Observable<DigitalPrescription> {
    return this.http.post<DigitalPrescription>(`${this.apiUrl}/${prescriptionId}/refill`, {});
  }

  // Cancel prescription
  cancelPrescription(prescriptionId: number, reason: string): Observable<DigitalPrescription> {
    return this.http.post<DigitalPrescription>(`${this.apiUrl}/${prescriptionId}/cancel`, { reason });
  }

  // Get prescription types
  getPrescriptionTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/types`);
  }

  // Get medication database
  searchMedications(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/medications/search?q=${query}`);
  }

  // Get drug interactions
  checkDrugInteractions(medications: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/interactions/check`, { medications });
  }

  // Current prescription state management
  setCurrentPrescription(prescription: DigitalPrescription | null): void {
    this.currentPrescription$.next(prescription);
  }

  getCurrentPrescription(): Observable<DigitalPrescription | null> {
    return this.currentPrescription$.asObservable();
  }

  getCurrentPrescriptionValue(): DigitalPrescription | null {
    return this.currentPrescription$.value;
  }

  // Utility methods
  getPrescriptionStatusColor(status: string): string {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'ISSUED': return 'primary';
      case 'SENT_TO_PHARMACY': return 'info';
      case 'PARTIALLY_DISPENSED': return 'warning';
      case 'FULLY_DISPENSED': return 'success';
      case 'EXPIRED': return 'danger';
      case 'CANCELLED':
      case 'REJECTED': return 'danger';
      default: return 'light';
    }
  }

  getPrescriptionTypeLabel(type: string): string {
    switch (type) {
      case 'ACUTE': return 'Acute Treatment';
      case 'CHRONIC': return 'Chronic Condition';
      case 'REPEAT': return 'Repeat Prescription';
      case 'EMERGENCY': return 'Emergency';
      case 'CONTROLLED_SUBSTANCE': return 'Controlled Substance';
      case 'OVER_THE_COUNTER': return 'Over-the-Counter';
      case 'SPECIALIST_PRESCRIPTION': return 'Specialist Prescription';
      default: return type;
    }
  }

  getMedicationStatusColor(status: string): string {
    switch (status) {
      case 'PRESCRIBED': return 'primary';
      case 'PENDING_APPROVAL': return 'warning';
      case 'APPROVED': return 'info';
      case 'DISPENSED': return 'success';
      case 'PARTIALLY_DISPENSED': return 'warning';
      case 'DISCONTINUED': return 'secondary';
      case 'SUBSTITUTED': return 'info';
      case 'REJECTED': return 'danger';
      default: return 'light';
    }
  }

  isRefillEligible(prescription: DigitalPrescription): boolean {
    return prescription.refillsRemaining > 0 && 
           prescription.status === 'ISSUED' && 
           new Date(prescription.validUntil || '') > new Date();
  }

  isExpiringSoon(prescription: DigitalPrescription): boolean {
    if (!prescription.expiryDate) return false;
    
    const expiryDate = new Date(prescription.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }

  calculateTotalCost(medications: PrescriptionMedication[]): number {
    return medications.reduce((total, med) => total + (med.costEstimate || 0), 0);
  }

  calculatePatientCost(medications: PrescriptionMedication[]): number {
    return medications.reduce((total, med) => total + (med.patientCopay || 0), 0);
  }
}
