import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface InsuranceProvider {
  name: string;
  consultationCoverage: number;
  prescriptionCoverage: number;
  appointmentCoverage: number;
}

export interface InsuranceEligibility {
  eligible: boolean;
  coveragePercentage: number;
  reason: string;
  effectiveDate: string;
  expirationDate: string;
}

export interface CoverageSummary {
  patientId: number;
  patientName: string;
  prescriptionCoverage: InsuranceEligibility;
  consultationCoverage: InsuranceEligibility;
  appointmentCoverage: InsuranceEligibility;
  lastUpdated: number;
}

export interface CostEstimate {
  serviceType: string;
  baseCost: number;
  coveragePercentage: number;
  insuranceCoverage: number;
  patientCost: number;
  eligible: boolean;
  patientId: number;
}

export interface ProviderInfo {
  name: string;
  consultationCoverage: number;
  prescriptionCoverage: number;
  appointmentCoverage: number;
  supported: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class InsuranceService {
  private apiUrl = `${environment.apiUrl}/insurance`;
  private currentCoverage$ = new BehaviorSubject<CoverageSummary | null>(null);

  constructor(private http: HttpClient) {}

  // Check eligibility for a service type
  checkEligibility(serviceType: string): Observable<InsuranceEligibility> {
    return this.http.get<InsuranceEligibility>(`${this.apiUrl}/eligibility/${serviceType}`)
      .pipe(
        catchError(error => {
          console.error('Error checking insurance eligibility:', error);
          throw error;
        })
      );
  }

  // Check patient eligibility (for doctors)
  checkPatientEligibility(serviceType: string, patientId: number): Observable<InsuranceEligibility> {
    return this.http.get<InsuranceEligibility>(`${this.apiUrl}/eligibility/${serviceType}/patient/${patientId}`)
      .pipe(
        catchError(error => {
          console.error('Error checking patient insurance eligibility:', error);
          throw error;
        })
      );
  }

  // Get supported insurance providers
  getSupportedProviders(): Observable<InsuranceProvider[]> {
    return this.http.get<InsuranceProvider[]>(`${this.apiUrl}/providers`)
      .pipe(
        catchError(error => {
          console.error('Error getting supported providers:', error);
          throw error;
        })
      );
  }

  // Verify coverage for a service
  verifyCoverage(serviceType: string, patientId?: number): Observable<any> {
    const body: any = { serviceType };
    if (patientId) {
      body.patientId = patientId;
    }

    return this.http.post<any>(`${this.apiUrl}/verify-coverage`, body)
      .pipe(
        catchError(error => {
          console.error('Error verifying coverage:', error);
          throw error;
        })
      );
  }

  // Get coverage summary for patient
  getCoverageSummary(): Observable<CoverageSummary> {
    return this.http.get<CoverageSummary>(`${this.apiUrl}/coverage-summary`)
      .pipe(
        map(summary => {
          this.currentCoverage$.next(summary);
          return summary;
        }),
        catchError(error => {
          console.error('Error getting coverage summary:', error);
          throw error;
        })
      );
  }

  // Get current coverage summary (cached)
  getCurrentCoverage(): Observable<CoverageSummary | null> {
    return this.currentCoverage$.asObservable();
  }

  // Estimate cost for a service
  estimateCost(serviceType: string, baseCost: number, patientId?: number): Observable<CostEstimate> {
    const body: any = { serviceType, baseCost };
    if (patientId) {
      body.patientId = patientId;
    }

    return this.http.post<CostEstimate>(`${this.apiUrl}/estimate-cost`, body)
      .pipe(
        catchError(error => {
          console.error('Error estimating cost:', error);
          throw error;
        })
      );
  }

  // Get provider information
  getProviderInfo(providerName: string): Observable<ProviderInfo> {
    return this.http.get<ProviderInfo>(`${this.apiUrl}/provider-info/${providerName}`)
      .pipe(
        catchError(error => {
          console.error('Error getting provider info:', error);
          throw error;
        })
      );
  }

  // Health check
  healthCheck(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/health`)
      .pipe(
        catchError(error => {
          console.error('Insurance service health check failed:', error);
          throw error;
        })
      );
  }

  // Utility methods
  formatCoverage(coveragePercentage: number): string {
    return `${Math.round(coveragePercentage * 100)}%`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getCoverageLevel(coveragePercentage: number): string {
    if (coveragePercentage >= 0.8) return 'excellent';
    if (coveragePercentage >= 0.6) return 'good';
    if (coveragePercentage >= 0.4) return 'fair';
    if (coveragePercentage >= 0.2) return 'poor';
    return 'none';
  }

  getCoverageLevelColor(coveragePercentage: number): string {
    const level = this.getCoverageLevel(coveragePercentage);
    switch (level) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'fair': return 'warning';
      case 'poor': return 'danger';
      default: return 'secondary';
    }
  }

  isEligibleForService(eligibility: InsuranceEligibility): boolean {
    return eligibility.eligible && eligibility.coveragePercentage > 0;
  }

  calculateSavings(baseCost: number, insuranceCoverage: number): number {
    return baseCost - insuranceCoverage;
  }

  getRecommendation(eligibility: InsuranceEligibility): string {
    if (!eligibility.eligible) {
      return 'This service is not covered by your insurance plan.';
    }
    
    const coverage = eligibility.coveragePercentage;
    if (coverage >= 0.8) {
      return 'Excellent coverage! Most costs will be covered.';
    } else if (coverage >= 0.6) {
      return 'Good coverage. You\'ll have moderate out-of-pocket costs.';
    } else if (coverage >= 0.4) {
      return 'Fair coverage. Consider budgeting for significant out-of-pocket costs.';
    } else if (coverage > 0) {
      return 'Limited coverage. Most costs will be out-of-pocket.';
    } else {
      return 'No coverage available for this service.';
    }
  }

  // Mock data for development/testing
  getMockCoverageSummary(): CoverageSummary {
    return {
      patientId: 1,
      patientName: 'John Doe',
      prescriptionCoverage: {
        eligible: true,
        coveragePercentage: 0.75,
        reason: 'Coverage verified',
        effectiveDate: '2024-01-01T00:00:00',
        expirationDate: '2024-12-31T23:59:59'
      },
      consultationCoverage: {
        eligible: true,
        coveragePercentage: 0.80,
        reason: 'Coverage verified',
        effectiveDate: '2024-01-01T00:00:00',
        expirationDate: '2024-12-31T23:59:59'
      },
      appointmentCoverage: {
        eligible: true,
        coveragePercentage: 0.85,
        reason: 'Coverage verified',
        effectiveDate: '2024-01-01T00:00:00',
        expirationDate: '2024-12-31T23:59:59'
      },
      lastUpdated: Date.now()
    };
  }

  getMockProviders(): InsuranceProvider[] {
    return [
      {
        name: 'Blue Cross Blue Shield',
        consultationCoverage: 0.80,
        prescriptionCoverage: 0.70,
        appointmentCoverage: 0.90
      },
      {
        name: 'Aetna',
        consultationCoverage: 0.75,
        prescriptionCoverage: 0.65,
        appointmentCoverage: 0.85
      },
      {
        name: 'Cigna',
        consultationCoverage: 0.78,
        prescriptionCoverage: 0.68,
        appointmentCoverage: 0.88
      },
      {
        name: 'United Healthcare',
        consultationCoverage: 0.82,
        prescriptionCoverage: 0.72,
        appointmentCoverage: 0.92
      },
      {
        name: 'Humana',
        consultationCoverage: 0.76,
        prescriptionCoverage: 0.66,
        appointmentCoverage: 0.86
      }
    ];
  }
}
