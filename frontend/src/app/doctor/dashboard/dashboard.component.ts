import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { ChatService } from '../../core/services/chat.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models/user.model';
import { Appointment } from '../../core/models/appointment.model';
import { Chat } from '../../core/models/chat.model';
import { ChatWindowComponent } from '../../chat/chat-window/chat-window.component';

interface DashboardStats {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
}

interface TodayAppointment {
  id: number;
  patientName: string;
  time: string;
  type: 'VIDEO_CALL' | 'IN_PERSON';
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

interface RecentActivity {
  title: string;
  description: string;
  time: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-doctor-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DoctorDashboardComponent implements OnInit {
  @ViewChild('chatWindow') chatWindow!: ChatWindowComponent;

  currentUser: User | null = null;
  isLoading = true;
  error = '';
  realTodayAppointments: Appointment[] = [];
  recentChats: Chat[] = [];

  dashboardStats: DashboardStats[] = [
    {
      title: 'Total Patients',
      value: '156',
      change: '+12%',
      changeType: 'increase',
      icon: 'people',
      color: 'text-primary'
    },
    {
      title: 'Today\'s Appointments',
      value: '8',
      change: '+2',
      changeType: 'increase',
      icon: 'calendar-check',
      color: 'text-success'
    },
    {
      title: 'Pending Reviews',
      value: '5',
      change: '-3',
      changeType: 'decrease',
      icon: 'clipboard-check',
      color: 'text-warning'
    },
    {
      title: 'Messages',
      value: '12',
      change: '+4',
      changeType: 'increase',
      icon: 'chat-dots',
      color: 'text-info'
    }
  ];

  todayAppointments: TodayAppointment[] = [
    {
      id: 1,
      patientName: 'John Smith',
      time: '09:00 AM',
      type: 'VIDEO_CALL',
      status: 'SCHEDULED'
    },
    {
      id: 2,
      patientName: 'Sarah Johnson',
      time: '10:30 AM',
      type: 'IN_PERSON',
      status: 'SCHEDULED'
    },
    {
      id: 3,
      patientName: 'Michael Brown',
      time: '02:00 PM',
      type: 'VIDEO_CALL',
      status: 'SCHEDULED'
    },
    {
      id: 4,
      patientName: 'Emily Davis',
      time: '03:30 PM',
      type: 'IN_PERSON',
      status: 'SCHEDULED'
    }
  ];

  recentActivities: RecentActivity[] = [
    {
      title: 'New Patient Registration',
      description: 'Alice Wilson registered as a new patient',
      time: '30 minutes ago',
      icon: 'person-plus',
      color: 'text-success'
    },
    {
      title: 'Appointment Rescheduled',
      description: 'Tom Anderson moved appointment to tomorrow',
      time: '1 hour ago',
      icon: 'calendar-event',
      color: 'text-warning'
    },
    {
      title: 'Message Received',
      description: 'New message from Lisa Parker about medication',
      time: '2 hours ago',
      icon: 'envelope',
      color: 'text-info'
    },
    {
      title: 'Lab Results Available',
      description: 'Blood test results for David Miller are ready',
      time: '3 hours ago',
      icon: 'file-medical',
      color: 'text-primary'
    }
  ];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private appointmentService: AppointmentService,
    private chatService: ChatService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadTodayAppointments();
    this.loadRecentChats();
  }

  private loadUserData(): void {
    this.authService.currentUser$.subscribe({
      next: (user) => {
        this.currentUser = user;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load user data';
        this.isLoading = false;
      }
    });
  }

  private loadTodayAppointments(): void {
    this.appointmentService.getTodayAppointments().subscribe({
      next: (appointments) => {
        this.realTodayAppointments = appointments;
        this.updateDashboardStats(appointments.length);
      },
      error: (error) => {
        console.error('Failed to load today appointments:', error);
      }
    });
  }

  private updateDashboardStats(todayCount: number): void {
    // Update the "Today's Appointments" stat with real data
    const todayStatIndex = this.dashboardStats.findIndex(stat => stat.title === "Today's Appointments");
    if (todayStatIndex !== -1) {
      this.dashboardStats[todayStatIndex].value = todayCount.toString();
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  getChangeClass(changeType: string): string {
    switch (changeType) {
      case 'increase': return 'text-success';
      case 'decrease': return 'text-danger';
      default: return 'text-muted';
    }
  }

  getChangeIcon(changeType: string): string {
    switch (changeType) {
      case 'increase': return 'bi-arrow-up';
      case 'decrease': return 'bi-arrow-down';
      default: return 'bi-dash';
    }
  }

  getAppointmentTypeIcon(type: string): string {
    return type === 'VIDEO_CALL' ? 'camera-video' : 'geo-alt';
  }

  getAppointmentTypeClass(type: string): string {
    return type === 'VIDEO_CALL' ? 'text-primary' : 'text-success';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'SCHEDULED': return 'badge bg-primary';
      case 'COMPLETED': return 'badge bg-success';
      case 'CANCELLED': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  startAppointment(appointment: TodayAppointment): void {
    if (appointment.type === 'VIDEO_CALL') {
      this.router.navigate(['/video-call'], { 
        queryParams: { appointmentId: appointment.id } 
      });
    } else {
      // For in-person appointments, navigate to patient details or appointment view
      this.router.navigate(['/appointments', appointment.id]);
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  startVideoCall(appointment: Appointment): void {
    console.log('🩺 Doctor starting video call for appointment:', appointment.id);

    this.notificationService.addNotification({
      type: 'system',
      title: 'Starting Video Call',
      message: `Starting video consultation with ${appointment.patient?.fullName || 'patient'}...`,
      priority: 'medium'
    });

    // Navigate to video consultation as host
    this.router.navigate(['/telemedicine/consultation', appointment.id], {
      queryParams: { role: 'host' }
    });
  }

  refreshData(): void {
    this.isLoading = true;
    this.loadTodayAppointments();
    this.loadRecentChats();
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  private loadRecentChats(): void {
    this.chatService.getUserChats().subscribe({
      next: (chats) => {
        this.recentChats = chats.slice(0, 3); // Show only recent 3 chats
      },
      error: (error) => {
        console.error('Failed to load chats:', error);
      }
    });
  }

  openChatModal(): void {
    const modalElement = document.getElementById('chatModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  openChat(chat: Chat): void {
    this.openChatModal();
    // Wait for modal to open, then load chat
    setTimeout(() => {
      this.onChatSelected(chat);
    }, 300);
  }

  onChatSelected(chat: Chat): void {
    if (this.chatWindow) {
      this.chatWindow.loadChat(chat);
    }
  }

  formatChatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
