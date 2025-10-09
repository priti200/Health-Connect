import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../core/services/chat.service';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-websocket-test',
  template: `
    <div class="websocket-test-panel">
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="fas fa-network-wired me-2"></i>
            WebSocket Connection Test
          </h5>
        </div>
        <div class="card-body">
          <!-- Connection Status -->
          <div class="mb-3">
            <label class="form-label">Connection Status:</label>
            <div class="d-flex align-items-center">
              <span [class]="connectionStatusClass">
                <i [class]="connectionIconClass"></i>
                {{ connectionStatusText }}
              </span>
              <button 
                class="btn btn-sm btn-outline-primary ms-2"
                (click)="testConnection()"
                [disabled]="isTestingConnection">
                <i class="fas fa-sync" [class.fa-spin]="isTestingConnection"></i>
                Test Connection
              </button>
            </div>
          </div>

          <!-- Test Message -->
          <div class="mb-3">
            <label for="testMessage" class="form-label">Test Message:</label>
            <div class="input-group">
              <input 
                type="text" 
                class="form-control" 
                id="testMessage"
                [(ngModel)]="testMessage"
                placeholder="Enter test message..."
                (keypress)="onKeyPress($event)">
              <button 
                class="btn btn-primary" 
                (click)="sendTestMessage()"
                [disabled]="!isConnected || !testMessage.trim()">
                Send Test
              </button>
            </div>
          </div>

          <!-- Test Results -->
          <div class="mb-3" *ngIf="testResults.length > 0">
            <label class="form-label">Test Results:</label>
            <div class="test-results">
              <div 
                *ngFor="let result of testResults" 
                class="test-result-item"
                [class]="result.type">
                <small class="timestamp">{{ result.timestamp | date:'HH:mm:ss.SSS' }}</small>
                <span class="message">{{ result.message }}</span>
              </div>
            </div>
          </div>

          <!-- Clear Results -->
          <button 
            class="btn btn-sm btn-outline-secondary"
            (click)="clearResults()"
            *ngIf="testResults.length > 0">
            Clear Results
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .websocket-test-panel {
      margin: 1rem 0;
    }
    
    .connection-status {
      font-weight: 500;
    }
    
    .status-connected {
      color: #28a745;
    }
    
    .status-disconnected {
      color: #dc3545;
    }
    
    .status-connecting {
      color: #ffc107;
    }
    
    .test-results {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #dee2e6;
      border-radius: 0.375rem;
      padding: 0.5rem;
      background-color: #f8f9fa;
    }
    
    .test-result-item {
      display: flex;
      margin-bottom: 0.25rem;
      font-family: monospace;
      font-size: 0.875rem;
    }
    
    .test-result-item.sent {
      color: #0066cc;
    }
    
    .test-result-item.received {
      color: #28a745;
    }
    
    .test-result-item.error {
      color: #dc3545;
    }
    
    .timestamp {
      margin-right: 0.5rem;
      color: #6c757d;
      min-width: 80px;
    }
    
    .message {
      flex: 1;
    }
  `]
})
export class WebSocketTestComponent implements OnInit, OnDestroy {
  isConnected = false;
  connectionStatusText = 'Checking...';
  connectionStatusClass = 'connection-status status-connecting';
  connectionIconClass = 'fas fa-circle-notch fa-spin';
  
  testMessage = 'Hello WebSocket!';
  isTestingConnection = false;
  
  testResults: Array<{
    timestamp: Date;
    message: string;
    type: 'sent' | 'received' | 'error';
  }> = [];
  
  private testClient: Client | null = null;
  private subscription: Subscription = new Subscription();

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.chatService.connectionStatus$.subscribe(connected => {
        this.isConnected = connected;
        this.updateConnectionStatus(connected);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.testClient) {
      this.testClient.deactivate();
    }
  }

  private updateConnectionStatus(connected: boolean): void {
    if (connected) {
      this.connectionStatusText = 'Connected';
      this.connectionStatusClass = 'connection-status status-connected';
      this.connectionIconClass = 'fas fa-check-circle';
    } else {
      this.connectionStatusText = 'Disconnected';
      this.connectionStatusClass = 'connection-status status-disconnected';
      this.connectionIconClass = 'fas fa-times-circle';
    }
  }

  testConnection(): void {
    this.isTestingConnection = true;
    this.addTestResult('Testing WebSocket connection...', 'sent');
    
    const token = this.authService.getToken();
    if (!token) {
      this.addTestResult('Error: No authentication token', 'error');
      this.isTestingConnection = false;
      return;
    }

    this.testClient = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: (frame) => {
        this.addTestResult('✅ Test connection successful', 'received');
        this.isTestingConnection = false;
        
        // Subscribe to test topic
        this.testClient?.subscribe('/topic/test', (message) => {
          this.addTestResult(`📨 Received: ${message.body}`, 'received');
        });
      },
      onStompError: (frame) => {
        this.addTestResult(`❌ STOMP Error: ${frame.body}`, 'error');
        this.isTestingConnection = false;
      },
      onWebSocketError: (error) => {
        this.addTestResult(`❌ WebSocket Error: ${error}`, 'error');
        this.isTestingConnection = false;
      }
    });

    this.testClient.activate();
  }

  sendTestMessage(): void {
    if (!this.testClient?.connected) {
      this.addTestResult('Error: Test client not connected', 'error');
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.addTestResult('Error: No authentication token', 'error');
      return;
    }

    try {
      this.testClient.publish({
        destination: '/app/test',
        body: this.testMessage,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      this.addTestResult(`📤 Sent: ${this.testMessage}`, 'sent');
      this.testMessage = 'Hello WebSocket!'; // Reset message
    } catch (error) {
      this.addTestResult(`❌ Send Error: ${error}`, 'error');
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.sendTestMessage();
    }
  }

  private addTestResult(message: string, type: 'sent' | 'received' | 'error'): void {
    this.testResults.push({
      timestamp: new Date(),
      message,
      type
    });
    
    // Keep only last 20 results
    if (this.testResults.length > 20) {
      this.testResults = this.testResults.slice(-20);
    }
  }

  clearResults(): void {
    this.testResults = [];
  }
}
