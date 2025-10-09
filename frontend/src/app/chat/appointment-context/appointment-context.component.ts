import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Appointment } from '../../core/models/appointment.model';
import { AppointmentService } from '../../core/services/appointment.service';

@Component({
  selector: 'app-appointment-context',
  templateUrl: './appointment-context.component.html',
  styleUrls: ['./appointment-context.component.scss']
})
export class AppointmentContextComponent implements OnInit {
  @Input() appointmentId?: number;
  @Input() chatType?: string;
  
  appointment: Appointment | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private appointmentService: AppointmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.appointmentId) {
      this.loadAppointment();
    }
  }

  private loadAppointment(): void {
    if (!this.appointmentId) return;
    
    this.loading = true;
    this.error = null;
    
    this.appointmentService.getAppointment(this.appointmentId).subscribe({
      next: (appointment) => {
        this.appointment = appointment;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load appointment details';
        this.loading = false;
        console.error('Error loading appointment:', error);
      }
    });
  }

  navigateToAppointment(): void {
    if (this.appointment) {
      this.router.navigate(['/appointments', this.appointment.id]);
    }
  }

  getContextTitle(): string {
    switch (this.chatType) {
      case 'PRE_APPOINTMENT':
        return 'Pre-Appointment Discussion';
      case 'POST_APPOINTMENT':
        return 'Post-Appointment Follow-up';
      case 'URGENT':
        return 'Urgent Medical Consultation';
      case 'PRESCRIPTION_INQUIRY':
        return 'Prescription Questions';
      case 'FOLLOW_UP':
        return 'Follow-up Care';
      default:
        return 'Appointment Discussion';
    }
  }

  getContextIcon(): string {
    switch (this.chatType) {
      case 'PRE_APPOINTMENT':
        return 'fas fa-clock text-info';
      case 'POST_APPOINTMENT':
        return 'fas fa-check-circle text-success';
      case 'URGENT':
        return 'fas fa-exclamation-triangle text-danger';
      case 'PRESCRIPTION_INQUIRY':
        return 'fas fa-pills text-primary';
      case 'FOLLOW_UP':
        return 'fas fa-stethoscope text-secondary';
      default:
        return 'fas fa-calendar text-primary';
    }
  }

  isBeforeAppointment(): boolean {
    if (!this.appointment) return false;
    const appointmentDateTime = new Date(`${this.appointment.date}T${this.appointment.startTime}`);
    return appointmentDateTime > new Date();
  }

  isAfterAppointment(): boolean {
    if (!this.appointment) return false;
    const appointmentDateTime = new Date(`${this.appointment.date}T${this.appointment.endTime}`);
    return appointmentDateTime < new Date();
  }

  getTimeUntilAppointment(): string {
    if (!this.appointment) return '';

    const appointmentDateTime = new Date(`${this.appointment.date}T${this.appointment.startTime}`);
    const now = new Date();
    const diffMs = appointmentDateTime.getTime() - now.getTime();

    if (diffMs <= 0) return 'Appointment has passed';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} remaining`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} remaining`;
    } else {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} remaining`;
    }
  }

  openMeetingLink(link: string): void {
    window.open(link, '_blank');
  }
}
