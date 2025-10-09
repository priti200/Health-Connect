import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { Appointment, AppointmentStatus, AppointmentType } from '../../core/models/appointment.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-appointment-list',
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.scss']
})
export class AppointmentListComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  currentUser: User | null = null;
  loading = false;
  error: string | null = null;

  // Filter options
  statusFilter: AppointmentStatus | '' = '';
  typeFilter: AppointmentType | '' = '';
  
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: AppointmentStatus.PENDING, label: 'Pending' },
    { value: AppointmentStatus.SCHEDULED, label: 'Scheduled' },
    { value: AppointmentStatus.CONFIRMED, label: 'Confirmed' },
    { value: AppointmentStatus.COMPLETED, label: 'Completed' },
    { value: AppointmentStatus.CANCELLED, label: 'Cancelled' }
  ];

  typeOptions = [
    { value: '', label: 'All Types' },
    { value: AppointmentType.IN_PERSON, label: 'In Person' },
    { value: AppointmentType.VIDEO_CALL, label: 'Video Call' }
  ];

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.error = null;

    this.appointmentService.getAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load appointments. Please try again.';
        this.loading = false;
        console.error('Error loading appointments:', error);
      }
    });
  }

  applyFilters(): void {
    this.filteredAppointments = this.appointments.filter(appointment => {
      const statusMatch = !this.statusFilter || appointment.status === this.statusFilter;
      const typeMatch = !this.typeFilter || appointment.type === this.typeFilter;
      return statusMatch && typeMatch;
    });
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onTypeFilterChange(): void {
    this.applyFilters();
  }

  viewAppointment(appointment: Appointment): void {
    this.router.navigate(['/appointments', appointment.id]);
  }

  editAppointment(appointment: Appointment): void {
    // For now, navigate to details page where editing can be done
    this.router.navigate(['/appointments', appointment.id]);
  }

  cancelAppointment(appointment: Appointment): void {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.cancelAppointment(appointment.id).subscribe({
        next: () => {
          this.loadAppointments(); // Reload the list
        },
        error: (error) => {
          this.error = 'Failed to cancel appointment. Please try again.';
          console.error('Error canceling appointment:', error);
        }
      });
    }
  }

  getStatusDisplayName(status: AppointmentStatus): string {
    return this.appointmentService.getStatusDisplayName(status);
  }

  getTypeDisplayName(type: AppointmentType): string {
    return this.appointmentService.getTypeDisplayName(type);
  }

  isBeforeAppointment(appointment: Appointment): boolean {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.startTime}`);
    return appointmentDateTime > new Date();
  }

  isAfterAppointment(appointment: Appointment): boolean {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.endTime}`);
    return appointmentDateTime < new Date();
  }

  getStatusBadgeClass(status: AppointmentStatus): string {
    return this.appointmentService.getStatusBadgeClass(status);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  isDoctor(): boolean {
    return this.currentUser?.role === 'DOCTOR';
  }

  isPatient(): boolean {
    return this.currentUser?.role === 'PATIENT';
  }

  canCancelAppointment(appointment: Appointment): boolean {
    return appointment.status === AppointmentStatus.PENDING || 
           appointment.status === AppointmentStatus.SCHEDULED ||
           appointment.status === AppointmentStatus.CONFIRMED;
  }

  getOtherParty(appointment: Appointment): string {
    if (this.isDoctor()) {
      return appointment.patient.fullName;
    } else {
      return appointment.doctor.fullName;
    }
  }

  getOtherPartyRole(appointment: Appointment): string {
    if (this.isDoctor()) {
      return 'Patient';
    } else {
      return 'Doctor';
    }
  }
}
