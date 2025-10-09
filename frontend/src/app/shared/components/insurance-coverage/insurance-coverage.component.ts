import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { InsuranceService, CoverageSummary, InsuranceEligibility } from '../../../core/services/insurance.service';
import { InternationalizationService } from '../../../core/services/internationalization.service';

@Component({
  selector: 'app-insurance-coverage',
  templateUrl: './insurance-coverage.component.html',
  styleUrls: ['./insurance-coverage.component.css']
})
export class InsuranceCoverageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  @Input() patientId?: number;
  @Input() showTitle = true;
  @Input() compact = false;
  
  coverageSummary: CoverageSummary | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private insuranceService: InsuranceService,
    public i18nService: InternationalizationService
  ) {}

  ngOnInit(): void {
    this.loadCoverageSummary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCoverageSummary(): void {
    this.loading = true;
    this.error = null;

    this.insuranceService.getCoverageSummary()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (summary) => {
          this.coverageSummary = summary;
        },
        error: (error) => {
          console.error('Error loading coverage summary:', error);
          this.error = 'Failed to load insurance coverage information';
          // Use mock data for development
          this.coverageSummary = this.insuranceService.getMockCoverageSummary();
        }
      });
  }

  getCoverageLevel(eligibility: InsuranceEligibility): string {
    return this.insuranceService.getCoverageLevel(eligibility.coveragePercentage);
  }

  getCoverageLevelColor(eligibility: InsuranceEligibility): string {
    return this.insuranceService.getCoverageLevelColor(eligibility.coveragePercentage);
  }

  formatCoverage(eligibility: InsuranceEligibility): string {
    return this.insuranceService.formatCoverage(eligibility.coveragePercentage);
  }

  getRecommendation(eligibility: InsuranceEligibility): string {
    return this.insuranceService.getRecommendation(eligibility);
  }

  isEligible(eligibility: InsuranceEligibility): boolean {
    return this.insuranceService.isEligibleForService(eligibility);
  }

  refresh(): void {
    this.loadCoverageSummary();
  }

  getCoverageIcon(eligibility: InsuranceEligibility): string {
    if (!eligibility.eligible) return 'fas fa-times-circle';
    
    const level = this.getCoverageLevel(eligibility);
    switch (level) {
      case 'excellent': return 'fas fa-check-circle';
      case 'good': return 'fas fa-check-circle';
      case 'fair': return 'fas fa-exclamation-triangle';
      case 'poor': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-times-circle';
    }
  }

  getCoverageText(serviceType: string): string {
    switch (serviceType) {
      case 'prescription': return this.i18nService.translateSync('prescriptions');
      case 'consultation': return this.i18nService.translateSync('video_consultation');
      case 'appointment': return this.i18nService.translateSync('appointments');
      default: return serviceType;
    }
  }

  getProgressBarClass(eligibility: InsuranceEligibility): string {
    const level = this.getCoverageLevel(eligibility);
    switch (level) {
      case 'excellent': return 'bg-success';
      case 'good': return 'bg-info';
      case 'fair': return 'bg-warning';
      case 'poor': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getProgressBarWidth(eligibility: InsuranceEligibility): number {
    return Math.round(eligibility.coveragePercentage * 100);
  }
}
