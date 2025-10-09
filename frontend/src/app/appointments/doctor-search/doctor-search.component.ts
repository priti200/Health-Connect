import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AppointmentService } from '../../core/services/appointment.service';
import { Doctor } from '../../core/models/appointment.model';

@Component({
  selector: 'app-doctor-search',
  templateUrl: './doctor-search.component.html',
  styleUrls: ['./doctor-search.component.scss']
})
export class DoctorSearchComponent implements OnInit {
  searchForm!: FormGroup;
  doctors: Doctor[] = [];
  specializations: string[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private router: Router
  ) {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      specialization: ['']
    });
  }

  ngOnInit(): void {
    this.loadSpecializations();
    this.loadDoctors();
  }

  loadSpecializations(): void {
    this.appointmentService.getSpecializations().subscribe({
      next: (specializations) => {
        this.specializations = specializations;
      },
      error: (error) => {
        console.error('Error loading specializations:', error);
      }
    });
  }

  loadDoctors(): void {
    this.loading = true;
    this.error = null;
    
    const specialization = this.searchForm.get('specialization')?.value;
    
    this.appointmentService.getDoctors(specialization || undefined).subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load doctors. Please try again.';
        this.loading = false;
        console.error('Error loading doctors:', error);
      }
    });
  }

  onSearch(): void {
    this.loadDoctors();
  }

  onClearSearch(): void {
    this.searchForm.reset();
    this.loadDoctors();
  }

  bookAppointment(doctor: Doctor): void {
    this.router.navigate(['/appointments/book'], { 
      queryParams: { doctorId: doctor.id } 
    });
  }

  getExperienceText(years?: number): string {
    if (!years) return 'Experience not specified';
    return years === 1 ? '1 year experience' : `${years} years experience`;
  }
}
