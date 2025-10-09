import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { ChatService } from '../../core/services/chat.service';
import { User } from '../../core/models/user.model';
import { Appointment } from '../../core/models/appointment.model';
import { Chat } from '../../core/models/chat.model';
import { ChatWindowComponent } from '../../chat/chat-window/chat-window.component';

interface HealthMetric {
  name: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'danger';
  icon: string;
  color: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}

@Component({
  selector: 'app-patient-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class PatientDashboardComponent implements OnInit {
  @ViewChild('chatWindow') chatWindow!: ChatWindowComponent;

  currentUser: User | null = null;
  isLoading = true;
  error = '';
  appointments: Appointment[] = [];
  upcomingAppointments: Appointment[] = [];
  recentChats: Chat[] = [];
  showPrescriptionAnalyzer = false;

  healthMetrics: HealthMetric[] = [
    {
      name: 'Heart Rate',
      value: '72',
      unit: 'bpm',
      status: 'normal',
      icon: 'heart-pulse',
      color: 'text-success'
    },
    {
      name: 'Blood Pressure',
      value: '120/80',
      unit: 'mmHg',
      status: 'normal',
      icon: 'activity',
      color: 'text-success'
    },
    {
      name: 'Weight',
      value: '70',
      unit: 'kg',
      status: 'normal',
      icon: 'speedometer2',
      color: 'text-info'
    },
    {
      name: 'Temperature',
      value: '98.6',
      unit: '°F',
      status: 'normal',
      icon: 'thermometer-half',
      color: 'text-success'
    }
  ];

  quickActions: QuickAction[] = [
    {
      title: 'Book Appointment',
      description: 'Schedule a consultation with a doctor',
      icon: 'calendar-plus',
      color: 'bg-primary',
      route: '/appointments/book'
    },
    {
      title: 'Find Doctors',
      description: 'Browse available healthcare providers',
      icon: 'search',
      color: 'bg-info',
      route: '/appointments/doctors'
    },
    {
      title: 'Prescription Analyzer',
      description: 'Analyze prescription images with AI for medicine information',
      icon: 'prescription-bottle-alt',
      color: 'bg-success',
      route: '#prescription-analyzer'
    },
    {
      title: 'AI Health Assistant',
      description: 'Get AI-powered health guidance and symptom analysis',
      icon: 'robot',
      color: 'bg-info',
      route: '/ai-health-bot'
    },
    {
      title: 'Messages',
      description: 'Chat with your healthcare providers',
      icon: 'chat-dots',
      color: 'bg-warning',
      route: '/chat'
    }
  ];

  recentActivities = [
    {
      title: 'Appointment Scheduled',
      description: 'Consultation with Dr. Smith on Dec 15, 2024',
      time: '2 hours ago',
      icon: 'calendar-check',
      color: 'text-primary'
    },
    {
      title: 'Health Metrics Updated',
      description: 'Blood pressure and weight recorded',
      time: '1 day ago',
      icon: 'graph-up',
      color: 'text-success'
    },
    {
      title: 'Message Received',
      description: 'New message from Dr. Johnson',
      time: '2 days ago',
      icon: 'envelope',
      color: 'text-info'
    }
  ];

  healthTips = [
    {
      title: 'Stay Hydrated',
      description: 'Drink at least 8 glasses of water daily for optimal health.',
      icon: 'droplet'
    },
    {
      title: 'Regular Exercise',
      description: 'Aim for 30 minutes of moderate exercise 5 days a week.',
      icon: 'bicycle'
    },
    {
      title: 'Healthy Sleep',
      description: 'Get 7-9 hours of quality sleep each night.',
      icon: 'moon'
    }
  ];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private appointmentService: AppointmentService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadAppointments();
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

  private loadAppointments(): void {
    this.appointmentService.getPatientAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.upcomingAppointments = appointments
          .filter(apt => new Date(apt.date) >= new Date())
          .slice(0, 3); // Show only next 3 appointments
        this.updateRecentActivities();
      },
      error: (error) => {
        console.error('Failed to load appointments:', error);
      }
    });
  }

  private updateRecentActivities(): void {
    // Update recent activities with real appointment data
    const recentAppointments = this.appointments
      .filter(apt => apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED')
      .slice(0, 2);

    this.recentActivities = [
      ...recentAppointments.map(apt => ({
        title: 'Appointment Scheduled',
        description: `Consultation with Dr. ${apt.doctor?.fullName} on ${apt.date}`,
        time: this.getTimeAgo(apt.createdAt),
        icon: 'calendar-check',
        color: 'text-primary'
      })),
      ...this.recentActivities.slice(recentAppointments.length)
    ];
  }

  private getTimeAgo(date: string): string {
    const now = new Date();
    const appointmentDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - appointmentDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  onQuickActionClick(action: QuickAction): void {
    if (action.route === '#prescription-analyzer') {
      this.showPrescriptionAnalyzer = true;
      // Scroll to prescription analyzer section
      setTimeout(() => {
        const element = document.getElementById('prescription-analyzer-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      this.navigateTo(action.route);
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'normal': return 'badge bg-success';
      case 'warning': return 'badge bg-warning';
      case 'danger': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  refreshData(): void {
    this.isLoading = true;
    this.loadAppointments();
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

  startChatWithDoctor(doctorId: number): void {
    console.log('Starting chat with doctor ID:', doctorId);

    if (!this.authService.isAuthenticated()) {
      alert('Please log in to start a chat.');
      return;
    }

    this.chatService.createOrGetChat(doctorId).subscribe({
      next: (chat) => {
        console.log('Chat created/retrieved:', chat);
        this.openChatModal();
        // Select the chat in the chat list
        setTimeout(() => {
          this.onChatSelected(chat);
        }, 500);
      },
      error: (error) => {
        console.error('Failed to create chat:', error);
        let errorMessage = 'Failed to start chat. ';

        if (error.status === 401) {
          errorMessage += 'Please log in again.';
          this.authService.logout();
        } else if (error.status === 403) {
          errorMessage += 'You do not have permission to start this chat.';
        } else if (error.error && error.error.message) {
          errorMessage += error.error.message;
        } else {
          errorMessage += 'Please try again.';
        }

        alert(errorMessage);
      }
    });
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
}
