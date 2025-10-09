import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../core/services/chat.service';

@Component({
  selector: 'app-websocket-status',
  template: `
    <div class="websocket-status" [ngClass]="statusClass">
      <i [class]="iconClass"></i>
      <span class="status-text">{{ statusText }}</span>
      <button 
        *ngIf="!isConnected" 
        class="btn btn-sm btn-outline-primary ms-2"
        (click)="reconnect()"
        [disabled]="isReconnecting">
        <i class="fas fa-sync" [class.fa-spin]="isReconnecting"></i>
        {{ isReconnecting ? 'Connecting...' : 'Reconnect' }}
      </button>
    </div>
  `,
  styles: [`
    .websocket-status {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      transition: all 0.3s ease;
    }
    
    .status-connected {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .status-disconnected {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    .status-connecting {
      background-color: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }
    
    .status-text {
      margin-left: 8px;
      font-weight: 500;
    }
    
    .fa-spin {
      animation: fa-spin 1s infinite linear;
    }
    
    @keyframes fa-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class WebSocketStatusComponent implements OnInit, OnDestroy {
  isConnected = false;
  isReconnecting = false;
  statusText = 'Connecting...';
  statusClass = 'status-connecting';
  iconClass = 'fas fa-circle-notch fa-spin';
  
  private subscription: Subscription = new Subscription();

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.chatService.connectionStatus$.subscribe(connected => {
        this.isConnected = connected;
        this.updateStatus(connected);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updateStatus(connected: boolean): void {
    if (connected) {
      this.statusText = 'Real-time chat connected';
      this.statusClass = 'status-connected';
      this.iconClass = 'fas fa-check-circle';
      this.isReconnecting = false;
    } else {
      this.statusText = 'Chat disconnected - some features may not work';
      this.statusClass = 'status-disconnected';
      this.iconClass = 'fas fa-exclamation-circle';
    }
  }

  reconnect(): void {
    this.isReconnecting = true;
    this.statusText = 'Reconnecting...';
    this.statusClass = 'status-connecting';
    this.iconClass = 'fas fa-circle-notch fa-spin';
    
    // Force reconnection
    this.chatService.disconnect();
    setTimeout(() => {
      this.chatService.forceConnect();
    }, 1000);
  }
}
