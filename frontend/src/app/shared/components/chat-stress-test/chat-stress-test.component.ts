import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-chat-stress-test',
  template: `
    <div class="chat-stress-test">
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="fas fa-vial me-2"></i>
            Chat Stress Test
          </h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <h6>Test Controls</h6>
              
              <!-- Message Count Test -->
              <div class="mb-3">
                <label class="form-label">Send Multiple Messages:</label>
                <div class="input-group">
                  <input 
                    type="number" 
                    class="form-control" 
                    [(ngModel)]="messageCount"
                    min="1" 
                    max="100"
                    placeholder="Number of messages">
                  <button 
                    class="btn btn-primary"
                    (click)="sendMultipleMessages()"
                    [disabled]="!selectedChatId || isTesting">
                    Send {{ messageCount }} Messages
                  </button>
                </div>
              </div>

              <!-- Auto Message Test -->
              <div class="mb-3">
                <label class="form-label">Auto Message Test:</label>
                <div class="input-group">
                  <input 
                    type="number" 
                    class="form-control" 
                    [(ngModel)]="autoInterval"
                    min="500" 
                    max="10000"
                    placeholder="Interval (ms)">
                  <button 
                    class="btn"
                    [class.btn-success]="!autoTesting"
                    [class.btn-danger]="autoTesting"
                    (click)="toggleAutoTest()"
                    [disabled]="!selectedChatId">
                    {{ autoTesting ? 'Stop' : 'Start' }} Auto Test
                  </button>
                </div>
              </div>

              <!-- Long Message Test -->
              <div class="mb-3">
                <button 
                  class="btn btn-warning"
                  (click)="sendLongMessage()"
                  [disabled]="!selectedChatId || isTesting">
                  Send Long Message
                </button>
              </div>

              <!-- Chat Selection -->
              <div class="mb-3">
                <label class="form-label">Select Chat for Testing:</label>
                <select 
                  class="form-select"
                  [(ngModel)]="selectedChatId">
                  <option value="">Select a chat...</option>
                  <option 
                    *ngFor="let chat of availableChats" 
                    [value]="chat.id">
                    Chat with {{ getOtherParticipant(chat)?.fullName }}
                  </option>
                </select>
              </div>
            </div>

            <div class="col-md-6">
              <h6>Test Results</h6>
              
              <!-- Statistics -->
              <div class="test-stats">
                <div class="stat-item">
                  <strong>Messages Sent:</strong> {{ messagesSent }}
                </div>
                <div class="stat-item">
                  <strong>Messages Received:</strong> {{ messagesReceived }}
                </div>
                <div class="stat-item">
                  <strong>Connection Status:</strong> 
                  <span [class]="connectionStatus ? 'text-success' : 'text-danger'">
                    {{ connectionStatus ? 'Connected' : 'Disconnected' }}
                  </span>
                </div>
                <div class="stat-item">
                  <strong>Test Duration:</strong> {{ testDuration }}s
                </div>
              </div>

              <!-- Test Log -->
              <div class="test-log mt-3">
                <h6>Test Log:</h6>
                <div class="log-container">
                  <div 
                    *ngFor="let log of testLogs" 
                    class="log-entry"
                    [class]="log.type">
                    <small class="timestamp">{{ log.timestamp | date:'HH:mm:ss.SSS' }}</small>
                    <span class="message">{{ log.message }}</span>
                  </div>
                </div>
              </div>

              <!-- Clear Results -->
              <button 
                class="btn btn-sm btn-outline-secondary mt-2"
                (click)="clearResults()">
                Clear Results
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-stress-test {
      margin: 1rem 0;
    }
    
    .test-stats {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 0.375rem;
      border: 1px solid #dee2e6;
    }
    
    .stat-item {
      margin-bottom: 0.5rem;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    .test-log {
      .log-container {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 0.375rem;
        padding: 0.5rem;
        background: #f8f9fa;
        font-family: monospace;
        font-size: 0.875rem;
      }
      
      .log-entry {
        display: flex;
        margin-bottom: 0.25rem;
        
        &.success {
          color: #28a745;
        }
        
        &.error {
          color: #dc3545;
        }
        
        &.info {
          color: #17a2b8;
        }
        
        .timestamp {
          margin-right: 0.5rem;
          color: #6c757d;
          min-width: 80px;
        }
        
        .message {
          flex: 1;
        }
      }
    }
  `]
})
export class ChatStressTestComponent implements OnInit, OnDestroy {
  messageCount = 10;
  autoInterval = 2000;
  selectedChatId: number | null = null;
  
  messagesSent = 0;
  messagesReceived = 0;
  connectionStatus = false;
  testDuration = 0;
  
  isTesting = false;
  autoTesting = false;
  
  availableChats: any[] = [];
  testLogs: Array<{
    timestamp: Date;
    message: string;
    type: 'success' | 'error' | 'info';
  }> = [];
  
  private subscriptions: Subscription[] = [];
  private autoTestSubscription?: Subscription;
  private testStartTime?: Date;
  private durationInterval?: any;
  
  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.subscribeToServices();
    this.loadAvailableChats();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.stopAutoTest();
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }
  }

  private subscribeToServices(): void {
    // Connection status
    this.subscriptions.push(
      this.chatService.connectionStatus$.subscribe(status => {
        this.connectionStatus = status;
        this.addLog(
          `Connection ${status ? 'established' : 'lost'}`,
          status ? 'success' : 'error'
        );
      })
    );

    // Message received
    this.subscriptions.push(
      this.chatService.messages$.subscribe(message => {
        if (this.selectedChatId && message.chatId === this.selectedChatId) {
          this.messagesReceived++;
          this.addLog(`Message received: ${message.content.substring(0, 30)}...`, 'info');
        }
      })
    );
  }

  private loadAvailableChats(): void {
    this.chatService.getUserChats().subscribe({
      next: (chats) => {
        this.availableChats = chats;
      },
      error: (error) => {
        this.addLog(`Failed to load chats: ${error.message}`, 'error');
      }
    });
  }

  sendMultipleMessages(): void {
    if (!this.selectedChatId || this.isTesting) return;

    this.isTesting = true;
    this.startTestTimer();
    
    this.addLog(`Starting to send ${this.messageCount} messages`, 'info');

    for (let i = 1; i <= this.messageCount; i++) {
      setTimeout(() => {
        try {
          const message = `Test message ${i}/${this.messageCount} - ${new Date().toISOString()}`;
          this.chatService.sendMessage(this.selectedChatId!, message);
          this.messagesSent++;
          
          if (i === this.messageCount) {
            this.isTesting = false;
            this.addLog(`Completed sending ${this.messageCount} messages`, 'success');
          }
        } catch (error) {
          this.addLog(`Failed to send message ${i}: ${error}`, 'error');
        }
      }, i * 100); // 100ms delay between messages
    }
  }

  toggleAutoTest(): void {
    if (this.autoTesting) {
      this.stopAutoTest();
    } else {
      this.startAutoTest();
    }
  }

  private startAutoTest(): void {
    if (!this.selectedChatId) return;

    this.autoTesting = true;
    this.startTestTimer();
    this.addLog(`Starting auto test with ${this.autoInterval}ms interval`, 'info');

    this.autoTestSubscription = interval(this.autoInterval).subscribe(() => {
      try {
        const message = `Auto test message - ${new Date().toLocaleTimeString()}`;
        this.chatService.sendMessage(this.selectedChatId!, message);
        this.messagesSent++;
      } catch (error) {
        this.addLog(`Auto test error: ${error}`, 'error');
        this.stopAutoTest();
      }
    });
  }

  private stopAutoTest(): void {
    this.autoTesting = false;
    if (this.autoTestSubscription) {
      this.autoTestSubscription.unsubscribe();
      this.autoTestSubscription = undefined;
    }
    this.addLog('Auto test stopped', 'info');
  }

  sendLongMessage(): void {
    if (!this.selectedChatId || this.isTesting) return;

    const longMessage = 'This is a very long message that tests how the chat handles large amounts of text. '.repeat(20) + 
                       'It should wrap properly and not break the UI layout. The input field should remain functional after sending this message.';
    
    try {
      this.chatService.sendMessage(this.selectedChatId, longMessage);
      this.messagesSent++;
      this.addLog('Long message sent successfully', 'success');
    } catch (error) {
      this.addLog(`Failed to send long message: ${error}`, 'error');
    }
  }

  private startTestTimer(): void {
    if (!this.testStartTime) {
      this.testStartTime = new Date();
      this.durationInterval = setInterval(() => {
        if (this.testStartTime) {
          this.testDuration = Math.floor((Date.now() - this.testStartTime.getTime()) / 1000);
        }
      }, 1000);
    }
  }

  clearResults(): void {
    this.messagesSent = 0;
    this.messagesReceived = 0;
    this.testDuration = 0;
    this.testLogs = [];
    this.testStartTime = undefined;
    
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = undefined;
    }
  }

  getOtherParticipant(chat: any): any {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.role === 'PATIENT' ? chat.doctor : chat.patient;
  }

  private addLog(message: string, type: 'success' | 'error' | 'info'): void {
    this.testLogs.push({
      timestamp: new Date(),
      message,
      type
    });
    
    // Keep only last 50 logs
    if (this.testLogs.length > 50) {
      this.testLogs = this.testLogs.slice(-50);
    }
  }
}
