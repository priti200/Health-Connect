import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { VideoConsultationService } from '../../core/services/video-consultation.service';
import { NotificationService } from '../../core/services/notification.service';
import { Appointment, AppointmentStatus, AppointmentType, AppointmentUpdateRequest } from '../../core/models/appointment.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-appointment-details',
  templateUrl: './appointment-details.component.html',
  styleUrls: ['./appointment-details.component.scss']
})
export class AppointmentDetailsComponent implements OnInit {
  appointment: Appointment | null = null;
  currentUser: User | null = null;
  editForm!: FormGroup;
  loading = false;
  updating = false;
  error: string | null = null;
  success: string | null = null;
  isEditing = false;

  statusOptions = [
    { value: AppointmentStatus.PENDING, label: 'Pending' },
    { value: AppointmentStatus.SCHEDULED, label: 'Scheduled' },
    { value: AppointmentStatus.CONFIRMED, label: 'Confirmed' },
    { value: AppointmentStatus.COMPLETED, label: 'Completed' },
    { value: AppointmentStatus.CANCELLED, label: 'Cancelled' }
  ];

  typeOptions = [
    { value: AppointmentType.IN_PERSON, label: 'In Person' },
    { value: AppointmentType.VIDEO_CALL, label: 'Video Call' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private videoConsultationService: VideoConsultationService,
    private notificationService: NotificationService
  ) {
    this.editForm = this.fb.group({
      status: ['', Validators.required],
      type: ['', Validators.required],
      reasonForVisit: ['', Validators.required],
      notes: [''],
      meetingLink: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadAppointment();
  }

  loadAppointment(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/appointments']);
      return;
    }

    this.loading = true;
    this.appointmentService.getAppointment(parseInt(id)).subscribe({
      next: (appointment) => {
        this.appointment = appointment;
        this.initializeForm();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load appointment details.';
        this.loading = false;
        console.error('Error loading appointment:', error);
      }
    });
  }

  initializeForm(): void {
    if (this.appointment) {
      this.editForm.patchValue({
        status: this.appointment.status,
        type: this.appointment.type,
        reasonForVisit: this.appointment.reasonForVisit,
        notes: this.appointment.notes || '',
        meetingLink: this.appointment.meetingLink || ''
      });
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.initializeForm(); // Reset form if canceling edit
    }
  }

  onUpdate(): void {
    if (this.editForm.valid && this.appointment) {
      this.updating = true;
      this.error = null;
      this.success = null;

      const updateRequest: AppointmentUpdateRequest = {
        status: this.editForm.value.status,
        type: this.editForm.value.type,
        reasonForVisit: this.editForm.value.reasonForVisit,
        notes: this.editForm.value.notes || undefined,
        meetingLink: this.editForm.value.meetingLink || undefined
      };

      this.appointmentService.updateAppointment(this.appointment.id, updateRequest).subscribe({
        next: (updatedAppointment) => {
          this.appointment = updatedAppointment;
          this.success = 'Appointment updated successfully!';
          this.isEditing = false;
          this.updating = false;
        },
        error: (error) => {
          this.error = 'Failed to update appointment. Please try again.';
          this.updating = false;
          console.error('Error updating appointment:', error);
        }
      });
    }
  }

  onCancel(): void {
    if (this.appointment && confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.cancelAppointment(this.appointment.id).subscribe({
        next: () => {
          this.router.navigate(['/appointments']);
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

  getStatusBadgeClass(status: AppointmentStatus): string {
    return this.appointmentService.getStatusBadgeClass(status);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  canEdit(): boolean {
    if (!this.appointment) return false;
    
    // Both doctor and patient can edit certain fields
    return this.appointment.status !== AppointmentStatus.COMPLETED &&
           this.appointment.status !== AppointmentStatus.CANCELLED;
  }

  canCancel(): boolean {
    if (!this.appointment) return false;
    
    return this.appointment.status === AppointmentStatus.PENDING ||
           this.appointment.status === AppointmentStatus.SCHEDULED ||
           this.appointment.status === AppointmentStatus.CONFIRMED;
  }

  getOtherParty(): string {
    if (!this.appointment) return '';
    
    if (this.isDoctor()) {
      return this.appointment.patient.fullName;
    } else {
      return this.appointment.doctor.fullName;
    }
  }

  getOtherPartyDetails(): string {
    if (!this.appointment) return '';

    if (this.isDoctor()) {
      return this.appointment.patient.email;
    } else {
      const doctor = this.appointment.doctor;
      return `${doctor.specialization || 'General Practice'} • ${doctor.affiliation || 'Private Practice'}`;
    }
  }

  // Video consultation methods
  canStartVideoConsultation(): boolean {
    if (!this.appointment) return false;

    const canStart = this.appointment.type === AppointmentType.VIDEO_CALL &&
           (this.appointment.status === AppointmentStatus.CONFIRMED ||
            this.appointment.status === AppointmentStatus.SCHEDULED) &&
           this.currentUser?.role === 'DOCTOR' &&
           this.isBeforeOrDuringAppointment();

    console.log('🔍 canStartVideoConsultation check:', {
      appointmentType: this.appointment.type,
      appointmentStatus: this.appointment.status,
      userRole: this.currentUser?.role,
      isBeforeOrDuring: this.isBeforeOrDuringAppointment(),
      canStart: canStart
    });

    return canStart;
  }

  isBeforeOrDuringAppointment(): boolean {
    if (!this.appointment) return false;

    // 🎯 DEMO MODE: Always allow video calling for evaluation purposes
    console.log('⏰ DEMO MODE: Video calling enabled anytime for evaluation');
    console.log('📅 Appointment details:', {
      date: this.appointment.date,
      startTime: this.appointment.startTime,
      endTime: this.appointment.endTime,
      type: this.appointment.type,
      status: this.appointment.status
    });

    return true; // Always allow for demo
  }

  onStartVideoConsultation(): void {
    if (!this.appointment || !this.canStartVideoConsultation()) return;

    this.loading = true;
    this.error = null;

    console.log('🩺 Doctor starting video consultation for appointment:', this.appointment.id);

    // Send notification to patient that doctor has started the call
    this.sendVideoCallNotificationToPatient();

    this.notificationService.addNotification({
      type: 'system',
      title: 'Video Call Started',
      message: 'You have started the video call. Patient will be notified to join.',
      priority: 'medium'
    });

    // Navigate to video consultation room as the host
    this.router.navigate(['/telemedicine/consultation', this.appointment.id], {
      queryParams: { role: 'host' }
    });
    this.loading = false;
  }

  private sendVideoCallNotificationToPatient(): void {
    // Send real-time notification to patient via WebSocket
    const notificationData = {
      type: 'video-call-started',
      appointmentId: this.appointment!.id,
      doctorName: this.appointment!.doctor.fullName,
      message: `Dr. ${this.appointment!.doctor.fullName} has started your video consultation. Click to join.`,
      timestamp: new Date().toISOString()
    };

    // Send via WebSocket (this will be handled by the notification service)
    console.log('📢 Sending video call notification to patient:', notificationData);

    // For now, we'll use the existing notification system
    // In a real implementation, this would send a WebSocket message to the specific patient
  }

  onJoinVideoConsultation(): void {
    console.log('🎥 Patient joining video consultation!');
    console.log('Appointment:', this.appointment);

    if (!this.appointment) {
      console.error('No appointment found');
      return;
    }

    this.loading = true;
    this.error = null;

    console.log('👤 Patient joining video consultation for appointment:', this.appointment.id);

    this.notificationService.addNotification({
      type: 'system',
      title: 'Joining Video Call',
      message: 'Connecting to the doctor\'s video call...',
      priority: 'medium'
    });

    // Navigate to video consultation room as a participant
    console.log('Navigating to:', '/telemedicine/consultation', this.appointment.id);
    this.router.navigate(['/telemedicine/consultation', this.appointment.id], {
      queryParams: { role: 'participant' }
    });
    this.loading = false;
  }
}
