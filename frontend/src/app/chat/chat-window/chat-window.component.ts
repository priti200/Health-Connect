import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Chat, Message, TypingNotification } from '../../core/models/chat.model';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() chat: Chat | null = null;
  @Output() messagesSent = new EventEmitter<void>();
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  @ViewChild('messageInput', { static: false }) messageInput!: ElementRef;

  messages: Message[] = [];
  messageContent: string = ''; // Non-nullable string - initialized to empty
  currentUser: any;
  loading = false;
  sending = false;
  typingUsers: Set<number> = new Set();
  connectionStatus = false;

  // Performance optimization
  private subscriptions: Subscription[] = [];
  private typingTimeout: any;
  private scrollTimeout: any;
  private isScrolledToBottom = true;
  private lastMessageCount = 0;
  private maxMessages = 1000; // Limit messages in memory

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.subscribeToServices();
  }

  ngAfterViewInit(): void {
    // Initialize scroll position tracking
    this.setupScrollListener();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chat'] && changes['chat'].currentValue) {
      this.loadChat(changes['chat'].currentValue);
    }
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions and timeouts
    this.subscriptions.forEach(sub => {
      if (sub && !sub.closed) {
        sub.unsubscribe();
      }
    });
    this.subscriptions = [];

    this.clearTimeouts();
  }

  private clearTimeouts(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }

  private subscribeToServices(): void {
    // Subscribe to connection status with error handling
    const connectionSub = this.chatService.connectionStatus$.subscribe({
      next: (status) => {
        this.connectionStatus = status;
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Connection status error:', error)
    });
    this.subscriptions.push(connectionSub);

    // Subscribe to new messages with optimized handling
    const messagesSub = this.chatService.messages$.subscribe({
      next: (message) => {
        if (this.chat && message.chatId === this.chat.id) {
          this.addNewMessage(message);
        }
      },
      error: (error) => console.error('Messages subscription error:', error)
    });
    this.subscriptions.push(messagesSub);

    // Subscribe to typing notifications with debouncing
    const typingSub = this.chatService.typing$
      .pipe(
        debounceTime(100),
        distinctUntilChanged()
      )
      .subscribe({
        next: (notification) => this.handleTypingNotification(notification),
        error: (error) => console.error('Typing notification error:', error)
      });
    this.subscriptions.push(typingSub);
  }

  private addNewMessage(message: Message): void {
    // Prevent duplicate messages
    const existingMessage = this.messages.find(m => m.id === message.id);
    if (existingMessage) {
      return;
    }

    // Add message to array
    this.messages.push(message);

    // Limit messages in memory for performance
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    // Mark as read if not from current user
    if (message.sender.id !== this.currentUser?.id) {
      this.chatService.markMessagesAsRead(this.chat!.id).subscribe({
        error: (error) => console.error('Mark as read error:', error)
      });
    }

    // Scroll to bottom if user is at bottom
    this.scheduleScrollToBottom();
    this.cdr.detectChanges();
  }

  loadChat(chat: Chat): void {
    // Clean up previous chat
    this.clearTimeouts();
    this.messages = [];
    this.typingUsers.clear();
    this.messageContent = '';
    this.isScrolledToBottom = true;

    this.chat = chat;

    if (chat) {
      this.loadMessages();
      this.chatService.subscribeToChatMessages(chat.id);
    }

    this.cdr.detectChanges();
  }

  private loadMessages(): void {
    if (!this.chat) return;

    this.loading = true;
    this.chatService.getChatMessages(this.chat.id).subscribe({
      next: (messages) => {
        this.messages = messages.reverse(); // Reverse to show oldest first
        this.loading = false;
        this.lastMessageCount = this.messages.length;
        this.scheduleScrollToBottom();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load messages:', error);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Removed old reactive form method - using sendSimpleMessage instead

  onTyping(): void {
    if (!this.chat) return;

    this.chatService.sendTypingNotification(this.chat.id, true);
    
    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    // Set timeout to stop typing after 3 seconds
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 3000);
  }

  private stopTyping(): void {
    if (!this.chat) return;
    
    this.chatService.sendTypingNotification(this.chat.id, false);
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  private handleTypingNotification(notification: TypingNotification): void {
    if (notification.userId === this.currentUser?.id) {
      return; // Ignore own typing notifications
    }

    if (notification.status === 'typing') {
      this.typingUsers.add(notification.userId);
    } else {
      this.typingUsers.delete(notification.userId);
    }
  }

  private setupScrollListener(): void {
    if (!this.messagesContainer) return;

    const element = this.messagesContainer.nativeElement;
    element.addEventListener('scroll', () => {
      this.ngZone.runOutsideAngular(() => {
        const { scrollTop, scrollHeight, clientHeight } = element;
        this.isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50;
      });
    });
  }

  private scheduleScrollToBottom(): void {
    if (!this.isScrolledToBottom) return;

    // Use requestAnimationFrame for smooth scrolling
    if (this.scrollTimeout) {
      cancelAnimationFrame(this.scrollTimeout);
    }

    this.scrollTimeout = requestAnimationFrame(() => {
      this.scrollToBottom();
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer?.nativeElement) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
        this.isScrolledToBottom = true;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  getOtherParticipant(): any {
    if (!this.chat) return null;
    return this.currentUser?.role === 'PATIENT' ? this.chat.doctor : this.chat.patient;
  }

  isTyping(): boolean {
    return this.typingUsers.size > 0;
  }

  formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatMessageDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  }

  shouldShowDateSeparator(index: number): boolean {
    if (index === 0) return true;

    const currentMessage = this.messages[index];
    const previousMessage = this.messages[index - 1];

    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();

    return currentDate !== previousDate;
  }

  // Optimized message sending - FIXED: No optional chaining needed
  sendMessage(): void {
    const content = this.messageContent.trim(); // messageContent is never null/undefined

    if (!content || !this.chat || !this.connectionStatus || this.sending) {
      return;
    }

    this.sending = true;

    try {
      this.chatService.sendMessage(this.chat.id, content);

      // Clear input immediately for better UX
      this.messageContent = '';
      this.stopTyping();
      this.messagesSent.emit();

      // Focus back to input
      this.focusInput();

    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      this.sending = false;
      this.cdr.detectChanges();
    }
  }

  private focusInput(): void {
    setTimeout(() => {
      if (this.messageInput?.nativeElement) {
        this.messageInput.nativeElement.focus();
      }
    }, 100);
  }

  // Handle Enter key press with better UX
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Handle input changes for typing notifications
  onInputChange(): void {
    this.onTyping();
  }

  // Prevent input field from losing focus
  onInputBlur(): void {
    // Small delay to prevent focus loss during send
    setTimeout(() => {
      if (this.messageInput?.nativeElement && document.activeElement !== this.messageInput.nativeElement) {
        this.stopTyping();
      }
    }, 100);
  }
}
