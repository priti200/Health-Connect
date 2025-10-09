import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'message' | 'appointment' | 'urgent' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  fromUser?: {
    id: number;
    name: string;
    avatar?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  private unreadCount$ = new BehaviorSubject<number>(0);

  constructor() {
    this.loadNotifications();
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      read: false
    };

    const currentNotifications = this.notifications$.value;
    const updatedNotifications = [newNotification, ...currentNotifications];
    
    this.notifications$.next(updatedNotifications);
    this.updateUnreadCount();
    this.saveNotifications(updatedNotifications);

    // Show browser notification if permission granted
    this.showBrowserNotification(newNotification);
  }

  markAsRead(notificationId: string): void {
    const notifications = this.notifications$.value.map(notification =>
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    );
    
    this.notifications$.next(notifications);
    this.updateUnreadCount();
    this.saveNotifications(notifications);
  }

  markAllAsRead(): void {
    const notifications = this.notifications$.value.map(notification => ({
      ...notification,
      read: true
    }));
    
    this.notifications$.next(notifications);
    this.updateUnreadCount();
    this.saveNotifications(notifications);
  }

  removeNotification(notificationId: string): void {
    const notifications = this.notifications$.value.filter(
      notification => notification.id !== notificationId
    );
    
    this.notifications$.next(notifications);
    this.updateUnreadCount();
    this.saveNotifications(notifications);
  }

  clearAll(): void {
    this.notifications$.next([]);
    this.unreadCount$.next(0);
    this.saveNotifications([]);
  }

  // Specific notification types
  addMessageNotification(fromUser: any, message: string, chatId: number): void {
    this.addNotification({
      type: 'message',
      title: `New message from ${fromUser.fullName}`,
      message: message.length > 100 ? message.substring(0, 100) + '...' : message,
      priority: 'medium',
      fromUser: {
        id: fromUser.id,
        name: fromUser.fullName,
        avatar: fromUser.avatar
      },
      actionUrl: `/chat?chatId=${chatId}`,
      actionText: 'Reply'
    });
  }

  addAppointmentNotification(type: 'booked' | 'reminder' | 'cancelled', appointment: any): void {
    let title = '';
    let message = '';
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';

    switch (type) {
      case 'booked':
        title = 'Appointment Booked';
        message = `Your appointment with ${appointment.doctor.fullName} is scheduled for ${appointment.date}`;
        break;
      case 'reminder':
        title = 'Appointment Reminder';
        message = `Your appointment with ${appointment.doctor.fullName} is in 1 hour`;
        priority = 'high';
        break;
      case 'cancelled':
        title = 'Appointment Cancelled';
        message = `Your appointment with ${appointment.doctor.fullName} has been cancelled`;
        priority = 'high';
        break;
    }

    this.addNotification({
      type: 'appointment',
      title,
      message,
      priority,
      actionUrl: `/appointments/${appointment.id}`,
      actionText: 'View Details'
    });
  }

  addUrgentNotification(title: string, message: string, actionUrl?: string): void {
    this.addNotification({
      type: 'urgent',
      title,
      message,
      priority: 'urgent',
      actionUrl,
      actionText: actionUrl ? 'View' : undefined
    });
  }

  private loadNotifications(): void {
    const stored = localStorage.getItem('healthconnect_notifications');
    if (stored) {
      try {
        const notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this.notifications$.next(notifications);
        this.updateUnreadCount();
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
  }

  private saveNotifications(notifications: Notification[]): void {
    try {
      localStorage.setItem('healthconnect_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notifications$.value.filter(n => !n.read).length;
    this.unreadCount$.next(unreadCount);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        tag: notification.id
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.showBrowserNotification(notification);
      }
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}
