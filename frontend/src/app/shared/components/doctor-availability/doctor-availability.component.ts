import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';

export interface DoctorAvailability {
  status: 'ONLINE' | 'BUSY' | 'AWAY' | 'OFFLINE' | 'DO_NOT_DISTURB';
  lastSeen?: string;
  expectedResponseTime?: string;
  customMessage?: string;
  chatStartTime?: string;
  chatEndTime?: string;
}

@Component({
  selector: 'app-doctor-availability',
  templateUrl: './doctor-availability.component.html',
  styleUrls: ['./doctor-availability.component.scss']
})
export class DoctorAvailabilityComponent implements OnInit, OnDestroy {
  @Input() doctorId!: number;
  @Input() showDetails = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  
  availability: DoctorAvailability | null = null;
  loading = false;
  private refreshSubscription?: Subscription;

  constructor() {}

  ngOnInit(): void {
    this.loadAvailability();
    this.startPeriodicRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private loadAvailability(): void {
    // Mock data for now - replace with actual service call
    this.availability = {
      status: 'ONLINE',
      expectedResponseTime: 'Within 2 hours',
      customMessage: 'Available for consultations',
      chatStartTime: '09:00',
      chatEndTime: '17:00'
    };
  }

  private startPeriodicRefresh(): void {
    // Refresh availability every 5 minutes
    this.refreshSubscription = interval(5 * 60 * 1000).subscribe(() => {
      this.loadAvailability();
    });
  }

  getStatusIcon(): string {
    if (!this.availability) return 'fas fa-circle text-secondary';
    
    switch (this.availability.status) {
      case 'ONLINE':
        return 'fas fa-circle text-success';
      case 'BUSY':
        return 'fas fa-circle text-warning';
      case 'AWAY':
        return 'fas fa-circle text-info';
      case 'DO_NOT_DISTURB':
        return 'fas fa-minus-circle text-danger';
      case 'OFFLINE':
      default:
        return 'fas fa-circle text-secondary';
    }
  }

  getStatusText(): string {
    if (!this.availability) return 'Unknown';
    
    switch (this.availability.status) {
      case 'ONLINE':
        return 'Online';
      case 'BUSY':
        return 'Busy';
      case 'AWAY':
        return 'Away';
      case 'DO_NOT_DISTURB':
        return 'Do Not Disturb';
      case 'OFFLINE':
      default:
        return 'Offline';
    }
  }

  getStatusClass(): string {
    if (!this.availability) return 'status-offline';
    
    switch (this.availability.status) {
      case 'ONLINE':
        return 'status-online';
      case 'BUSY':
        return 'status-busy';
      case 'AWAY':
        return 'status-away';
      case 'DO_NOT_DISTURB':
        return 'status-dnd';
      case 'OFFLINE':
      default:
        return 'status-offline';
    }
  }

  isAvailable(): boolean {
    return this.availability?.status === 'ONLINE' || this.availability?.status === 'AWAY';
  }

  getLastSeenText(): string {
    if (!this.availability?.lastSeen) return '';
    
    const lastSeen = new Date(this.availability.lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  }

  isWithinChatHours(): boolean {
    if (!this.availability?.chatStartTime || !this.availability?.chatEndTime) {
      return true; // Assume available if no hours set
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    return currentTime >= this.availability.chatStartTime && 
           currentTime <= this.availability.chatEndTime;
  }
}
