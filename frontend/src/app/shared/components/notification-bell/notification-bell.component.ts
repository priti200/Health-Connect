import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  showDropdown = false;
  loading = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to notifications
    const notificationsSub = this.notificationService.getNotifications().subscribe(
      notifications => {
        this.notifications = notifications.slice(0, 10); // Show only latest 10
      }
    );
    this.subscriptions.push(notificationsSub);

    // Subscribe to unread count
    const unreadSub = this.notificationService.getUnreadCount().subscribe(
      count => this.unreadCount = count
    );
    this.subscriptions.push(unreadSub);

    // Request notification permission
    this.notificationService.requestNotificationPermission();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  markAsRead(notification: Notification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id);
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  handleNotificationClick(notification: Notification): void {
    this.markAsRead(notification);
    
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
    
    this.closeDropdown();
  }

  removeNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.removeNotification(notification.id);
  }

  clearAll(): void {
    this.notificationService.clearAll();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'message':
        return 'fas fa-comment';
      case 'appointment':
        return 'fas fa-calendar';
      case 'urgent':
        return 'fas fa-exclamation-triangle';
      case 'system':
        return 'fas fa-cog';
      default:
        return 'fas fa-bell';
    }
  }

  getNotificationClass(notification: Notification): string {
    const classes = ['notification-item'];
    
    if (!notification.read) {
      classes.push('unread');
    }
    
    classes.push(`priority-${notification.priority}`);
    
    return classes.join(' ');
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }
}
