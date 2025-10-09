import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-quick-chat-widget',
  templateUrl: './quick-chat-widget.component.html',
  styleUrls: ['./quick-chat-widget.component.scss']
})
export class QuickChatWidgetComponent implements OnInit {
  recentChats: any[] = [];
  upcomingAppointments: any[] = [];
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
    this.loadRecentChats();
    this.loadUpcomingAppointments();
  }

  private loadRecentChats(): void {
    this.chatService.getUserChats().subscribe({
      next: (chats) => {
        this.recentChats = chats.slice(0, 3); // Show only 3 most recent
      },
      error: (error) => {
        console.error('Error loading recent chats:', error);
      }
    });
  }

  private loadUpcomingAppointments(): void {
    if (this.currentUser?.role === 'PATIENT') {
      this.appointmentService.getPatientAppointments().subscribe({
        next: (appointments) => {
          const now = new Date();
          this.upcomingAppointments = appointments
            .filter(apt => new Date(`${apt.date}T${apt.startTime}`) > now)
            .slice(0, 3); // Show only 3 upcoming
        },
        error: (error) => {
          console.error('Error loading appointments:', error);
        }
      });
    }
  }

  navigateToChat(chatId?: number): void {
    if (chatId) {
      this.router.navigate(['/chat'], { queryParams: { chatId } });
    } else {
      this.router.navigate(['/chat']);
    }
  }

  startAppointmentChat(appointment: any, chatType: string): void {
    const participantId = this.currentUser.role === 'PATIENT' 
      ? appointment.doctor.id 
      : appointment.patient.id;

    this.appointmentService.createAppointmentChat(
      appointment.id,
      participantId,
      chatType,
      `${chatType.replace('_', ' ')} discussion for appointment on ${appointment.date}`
    ).subscribe({
      next: (chat) => {
        this.router.navigate(['/chat'], { 
          queryParams: { 
            chatId: chat.id,
            appointmentId: appointment.id 
          } 
        });
      },
      error: (error) => {
        console.error('Error creating appointment chat:', error);
      }
    });
  }

  isBeforeAppointment(appointment: any): boolean {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.startTime}`);
    return appointmentDateTime > new Date();
  }

  getTimeUntilAppointment(appointment: any): string {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.startTime}`);
    const now = new Date();
    const diffMs = appointmentDateTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'Soon';
    }
  }

  getOtherParticipant(chat: any): any {
    return this.currentUser.role === 'PATIENT' ? chat.doctor : chat.patient;
  }
}
