import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { Doctor, TimeSlot, AppointmentType, AppointmentRequest } from '../../core/models/appointment.model';

@Component({
  selector: 'app-appointment-booking',
  templateUrl: './appointment-booking.component.html',
  styleUrls: ['./appointment-booking.component.scss']
})
export class AppointmentBookingComponent implements OnInit {
  bookingForm!: FormGroup;
  doctors: Doctor[] = [];
  selectedDoctor: Doctor | null = null;
  timeSlots: TimeSlot[] = [];
  availableSlots: TimeSlot[] = [];
  loading = false;
  submitting = false;
  error: string | null = null;
  success: string | null = null;

  appointmentTypes = [
    { value: AppointmentType.IN_PERSON, label: 'In Person' },
    { value: AppointmentType.VIDEO_CALL, label: 'Video Call' }
  ];

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.bookingForm = this.fb.group({
      doctorId: ['', Validators.required],
      date: ['', Validators.required],
      timeSlot: ['', Validators.required],
      type: [AppointmentType.IN_PERSON, Validators.required],
      reasonForVisit: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Check if user is a patient
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.role !== 'PATIENT') {
      this.error = 'Only patients can book appointments. Please log in with a patient account.';
      return;
    }

    this.loadDoctors();

    // Check if doctor ID is provided in query params
    this.route.queryParams.subscribe(params => {
      if (params['doctorId']) {
        this.bookingForm.patchValue({ doctorId: params['doctorId'] });
        this.onDoctorChange();
      }
    });

    // Set minimum date to today (allow same-day appointments)
    const today = new Date();
    // Ensure we're using the correct timezone
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    this.bookingForm.get('date')?.setValue(todayStr);
    console.log('Setting default date to:', todayStr);

    // Watch for form changes
    this.bookingForm.get('doctorId')?.valueChanges.subscribe(() => this.onDoctorChange());
    this.bookingForm.get('date')?.valueChanges.subscribe(() => this.onDateChange());
  }

  loadDoctors(): void {
    this.appointmentService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors;
      },
      error: (error) => {
        this.error = 'Failed to load doctors. Please try again.';
        console.error('Error loading doctors:', error);
      }
    });
  }

  onDoctorChange(): void {
    const doctorId = this.bookingForm.get('doctorId')?.value;
    if (doctorId) {
      this.selectedDoctor = this.doctors.find(d => d.id == doctorId) || null;
      this.loadTimeSlots();
    } else {
      this.selectedDoctor = null;
      this.timeSlots = [];
      this.availableSlots = [];
    }
  }

  onDateChange(): void {
    if (this.selectedDoctor) {
      this.loadTimeSlots();
    }
  }

  loadTimeSlots(): void {
    const doctorId = this.bookingForm.get('doctorId')?.value;
    const date = this.bookingForm.get('date')?.value;
    
    if (!doctorId || !date) return;

    this.loading = true;
    this.appointmentService.getAvailableTimeSlots(doctorId, date).subscribe({
      next: (slots) => {
        this.timeSlots = slots;
        this.availableSlots = slots.filter(slot => slot.available);
        this.loading = false;
        
        // Clear selected time slot if it's no longer available
        const currentSlot = this.bookingForm.get('timeSlot')?.value;
        if (currentSlot && !this.availableSlots.find(slot => 
          slot.startTime === currentSlot.split('-')[0] && 
          slot.endTime === currentSlot.split('-')[1])) {
          this.bookingForm.patchValue({ timeSlot: '' });
        }
      },
      error: (error) => {
        this.error = 'Failed to load available time slots. Please try again.';
        this.loading = false;
        console.error('Error loading time slots:', error);
      }
    });
  }

  onSubmit(): void {
    console.log('Form submission started');
    console.log('Form valid:', this.bookingForm.valid);
    console.log('Form errors:', this.bookingForm.errors);
    console.log('Form value:', this.bookingForm.value);
    console.log('Individual field validation:');
    Object.keys(this.bookingForm.controls).forEach(key => {
      const control = this.bookingForm.get(key);
      console.log(`  ${key}: valid=${control?.valid}, value=${control?.value}, errors=`, control?.errors);
    });

    if (this.bookingForm.valid) {
      this.submitting = true;
      this.error = null;
      this.success = null;

      const formValue = this.bookingForm.value;

      if (!formValue.timeSlot || !formValue.timeSlot.includes('-')) {
        this.error = 'Please select a valid time slot.';
        this.submitting = false;
        console.error('Invalid time slot format:', formValue.timeSlot);
        console.error('Available slots:', this.availableSlots);
        return;
      }

      const [startTime, endTime] = formValue.timeSlot.split('-');
      console.log('Parsed time slot:', { original: formValue.timeSlot, startTime, endTime });

      const request: AppointmentRequest = {
        doctorId: parseInt(formValue.doctorId),
        date: formValue.date,
        startTime: startTime,
        endTime: endTime,
        type: formValue.type,
        reasonForVisit: formValue.reasonForVisit,
        notes: formValue.notes || ""
      };

      console.log('Submitting appointment request:', request);
      console.log('Form value:', formValue);

      this.appointmentService.createAppointment(request).subscribe({
        next: (appointment) => {
          this.success = 'Appointment booked successfully!';
          this.submitting = false;
          
          // Redirect to appointment details after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/appointments', appointment.id]);
          }, 2000);
        },
        error: (error) => {
          this.submitting = false;
          console.error('Error booking appointment:', error);
          console.error('Error details:', error.error);
          console.error('Request data:', request);

          // Provide specific error messages based on the error
          if (error.status === 400 && error.error?.error) {
            this.error = error.error.error;
          } else if (error.status === 403) {
            this.error = 'Access denied. Please ensure you are logged in as a patient.';
          } else if (error.status === 409) {
            this.error = 'This time slot is no longer available. Please select a different time.';
          } else {
            this.error = 'Failed to book appointment. Please try again.';
          }
        }
      });
    } else {
      console.log('Form is invalid');
      console.log('Form errors:', this.getFormValidationErrors());
      this.error = 'Please fill in all required fields correctly.';
      this.markFormGroupTouched();
    }
  }

  private getFormValidationErrors(): any {
    const formErrors: any = {};
    Object.keys(this.bookingForm.controls).forEach(key => {
      const controlErrors = this.bookingForm.get(key)?.errors;
      if (controlErrors) {
        formErrors[key] = controlErrors;
      }
    });
    return formErrors;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.bookingForm.controls).forEach(key => {
      const control = this.bookingForm.get(key);
      control?.markAsTouched();
    });
  }

  getTimeSlotDisplay(slot: TimeSlot): string {
    return `${this.formatTime(slot.startTime)} - ${this.formatTime(slot.endTime)}`;
  }

  getTimeSlotValue(slot: TimeSlot): string {
    return `${slot.startTime}-${slot.endTime}`;
  }

  private formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getTodayDate(): string {
    // Return today's date as minimum (allow same-day appointments)
    const today = new Date();
    // Ensure we're using the correct timezone
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
