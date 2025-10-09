import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';

export interface ChatAccessConfig {
  appointmentId?: number;
  doctorId?: number;
  patientId?: number;
  chatType?: 'GENERAL' | 'PRE_APPOINTMENT' | 'POST_APPOINTMENT' | 'URGENT' | 'PRESCRIPTION_INQUIRY' | 'FOLLOW_UP';
  subject?: string;
  buttonText?: string;
  buttonClass?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

@Component({
  selector: 'app-chat-access',
  templateUrl: './chat-access.component.html',
  styleUrls: ['./chat-access.component.scss']
})
export class ChatAccessComponent implements OnInit {
  @Input() config: ChatAccessConfig = {};
  
  loading = false;
  currentUser: any;

  constructor(
    private chatService: ChatService,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.setDefaults();
  }

  private setDefaults(): void {
    if (!this.config.buttonText) {
      this.config.buttonText = this.getDefaultButtonText();
    }
    if (!this.config.buttonClass) {
      this.config.buttonClass = 'btn-primary';
    }
    if (this.config.showIcon === undefined) {
      this.config.showIcon = true;
    }
    if (!this.config.size) {
      this.config.size = 'md';
    }
  }

  private getDefaultButtonText(): string {
    switch (this.config.chatType) {
      case 'PRE_APPOINTMENT':
        return 'Chat Before Appointment';
      case 'POST_APPOINTMENT':
        return 'Follow-up Chat';
      case 'URGENT':
        return 'Urgent Chat';
      case 'PRESCRIPTION_INQUIRY':
        return 'Ask About Prescription';
      case 'FOLLOW_UP':
        return 'Follow-up Questions';
      default:
        return 'Start Chat';
    }
  }

  async startChat(): Promise<void> {
    if (this.loading) return;

    this.loading = true;

    try {
      let participantId: number;

      // Determine participant ID based on current user role
      if (this.currentUser.role === 'PATIENT') {
        if (!this.config.doctorId) {
          throw new Error('Doctor ID is required for patient to start chat');
        }
        participantId = this.config.doctorId;
      } else if (this.currentUser.role === 'DOCTOR') {
        if (!this.config.patientId) {
          throw new Error('Patient ID is required for doctor to start chat');
        }
        participantId = this.config.patientId;
      } else {
        throw new Error('Invalid user role');
      }

      console.log('Starting chat:', {
        currentUser: this.currentUser.role,
        currentUserId: this.currentUser.id,
        participantId: participantId,
        config: this.config
      });

      let chatResponse;

      if (this.config.appointmentId) {
        // Create appointment-specific chat
        chatResponse = await this.appointmentService.createAppointmentChat(
          this.config.appointmentId,
          participantId,
          this.config.chatType || 'GENERAL',
          this.config.subject
        ).toPromise();
      } else {
        // Create general chat
        chatResponse = await this.chatService.createOrGetChat(participantId).toPromise();
      }

      // Navigate to chat
      this.router.navigate(['/chat'], {
        queryParams: {
          chatId: chatResponse.id,
          appointmentId: this.config.appointmentId
        }
      });

    } catch (error) {
      console.error('Error starting chat:', error);
      // Show user-friendly error message
      alert('Failed to start chat: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      this.loading = false;
    }
  }

  get buttonSizeClass(): string {
    switch (this.config.size) {
      case 'sm': return 'btn-sm';
      case 'lg': return 'btn-lg';
      default: return '';
    }
  }

  get iconClass(): string {
    switch (this.config.chatType) {
      case 'URGENT':
        return 'fas fa-exclamation-triangle text-warning';
      case 'PRESCRIPTION_INQUIRY':
        return 'fas fa-pills';
      case 'FOLLOW_UP':
        return 'fas fa-stethoscope';
      default:
        return 'fas fa-comments';
    }
  }
}
