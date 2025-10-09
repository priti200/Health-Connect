import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { PresenceService } from '../../core/services/presence.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Chat, Message, MessageStatusUpdate, MessageReactionUpdate, PresenceTypingNotification } from '../../core/models/chat.model';

@Component({
  selector: 'app-enhanced-chat',
  templateUrl: './enhanced-chat.component.html',
  styleUrls: ['./enhanced-chat.component.scss']
})
export class EnhancedChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  @ViewChild('messageInput', { static: false }) messageInput!: ElementRef;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  chat: Chat | null = null;
  messages: Message[] = [];
  currentUser: any;
  
  messageForm: FormGroup;
  isLoading = false;
  isConnected = false;
  isTyping = false;
  typingUsers: string[] = [];
  
  // UI state
  showEmojiPicker = false;
  showAttachmentMenu = false;
  replyToMessage: Message | null = null;
  
  // File upload
  selectedFile: File | null = null;
  dragOver = false;
  
  // Pagination
  currentPage = 0;
  pageSize = 50;
  hasMoreMessages = true;
  
  private subscriptions: Subscription[] = [];
  private typingTimeout: any;
  private shouldScrollToBottom = true;

  // Make Object available in template
  public Object = Object;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private chatService: ChatService,
    public presenceService: PresenceService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.messageForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeChat();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private initializeChat(): void {
    const chatId = this.route.snapshot.queryParams['chatId'];
    if (!chatId) {
      this.router.navigate(['/chat']);
      return;
    }

    this.isLoading = true;
    this.loadChatMessages(chatId);
    this.chatService.subscribeToChatMessages(chatId);
  }

  private setupSubscriptions(): void {
    // Connection status
    this.subscriptions.push(
      this.chatService.connectionStatus$.subscribe(connected => {
        this.isConnected = connected;
      })
    );

    // New messages
    this.subscriptions.push(
      this.chatService.messages$.subscribe(message => {
        this.addMessage(message);
        this.shouldScrollToBottom = true;
        
        // Mark message as read if not from current user
        if (message.sender.id !== this.currentUser?.id) {
          this.chatService.markMessageAsRead(message.id);
        }
      })
    );

    // Typing notifications
    this.subscriptions.push(
      this.chatService.typing$.subscribe(notification => {
        this.handleTypingNotification(notification);
      })
    );

    // Message status updates
    this.subscriptions.push(
      this.chatService.messageStatus$.subscribe(status => {
        this.handleMessageStatusUpdate(status);
      })
    );

    // Message reactions
    this.subscriptions.push(
      this.chatService.messageReactions$.subscribe(reaction => {
        this.handleMessageReaction(reaction);
      })
    );

    // Presence updates
    this.subscriptions.push(
      this.presenceService.getTypingNotifications().subscribe(notification => {
        this.handlePresenceTyping(notification);
      })
    );
  }

  private loadChatMessages(chatId: number): void {
    this.chatService.getChatMessages(chatId, this.currentPage, this.pageSize)
      .subscribe({
        next: (messages) => {
          this.messages = messages.reverse(); // Reverse to show oldest first
          this.isLoading = false;
          this.shouldScrollToBottom = true;
          this.hasMoreMessages = messages.length === this.pageSize;
        },
        error: (error) => {
          console.error('Error loading messages:', error);
          this.isLoading = false;
          this.notificationService.addNotification({
            type: 'system',
            title: 'Error',
            message: 'Failed to load chat messages',
            priority: 'high'
          });
        }
      });
  }

  private addMessage(message: Message): void {
    // Check if message already exists
    const existingIndex = this.messages.findIndex(m => m.id === message.id);
    if (existingIndex === -1) {
      this.messages.push(message);
    } else {
      this.messages[existingIndex] = message;
    }
  }

  private handleTypingNotification(notification: any): void {
    if (notification.userId === this.currentUser?.id) {
      return; // Ignore own typing notifications
    }

    const userName = notification.userEmail || `User ${notification.userId}`;
    
    if (notification.status === 'typing') {
      if (!this.typingUsers.includes(userName)) {
        this.typingUsers.push(userName);
      }
    } else {
      this.typingUsers = this.typingUsers.filter(user => user !== userName);
    }
  }

  private handlePresenceTyping(notification: any): void {
    const chatId = this.route.snapshot.queryParams['chatId'];
    if (notification.chatId !== parseInt(chatId) || notification.userId === this.currentUser?.id) {
      return;
    }

    // Update typing status based on presence service
    // This would integrate with user names from presence service
  }

  private handleMessageStatusUpdate(status: any): void {
    const messageIndex = this.messages.findIndex(m => m.id === status.messageId);
    if (messageIndex !== -1) {
      this.messages[messageIndex].status = status.status;
      this.messages[messageIndex].readAt = status.timestamp;
    }
  }

  private handleMessageReaction(reaction: any): void {
    const messageIndex = this.messages.findIndex(m => m.id === reaction.messageId);
    if (messageIndex !== -1) {
      if (!this.messages[messageIndex].reactions) {
        this.messages[messageIndex].reactions = {};
      }
      
      if (reaction.action === 'added') {
        this.messages[messageIndex].reactions![reaction.userId] = reaction.reaction;
      } else {
        delete this.messages[messageIndex].reactions![reaction.userId];
      }
    }
  }

  public sendMessage(): void {
    if (this.messageForm.invalid || !this.isConnected) {
      return;
    }

    const content = this.messageForm.get('content')?.value?.trim();
    if (!content && !this.selectedFile) {
      return;
    }

    const chatId = this.route.snapshot.queryParams['chatId'];
    
    try {
      if (this.selectedFile) {
        // Send message with attachment
        this.chatService.sendMessageWithAttachment(chatId, content, this.selectedFile)
          .subscribe({
            next: (message) => {
              this.addMessage(message);
              this.shouldScrollToBottom = true;
            },
            error: (error) => {
              console.error('Error sending message with attachment:', error);
              this.notificationService.addNotification({
                type: 'system',
                title: 'Error',
                message: 'Failed to send message with attachment',
                priority: 'high'
              });
            }
          });
        this.selectedFile = null;
      } else if (this.replyToMessage) {
        // Send reply
        this.chatService.replyToMessage(chatId, content, this.replyToMessage.id);
        this.replyToMessage = null;
      } else {
        // Send regular message
        this.chatService.sendMessage(chatId, content);
      }

      this.messageForm.reset();
      this.stopTyping();
      
    } catch (error) {
      console.error('Error sending message:', error);
      this.notificationService.addNotification({
        type: 'system',
        title: 'Error',
        message: 'Failed to send message',
        priority: 'high'
      });
    }
  }

  public onTyping(): void {
    if (!this.isTyping) {
      this.isTyping = true;
      const chatId = this.route.snapshot.queryParams['chatId'];
      this.presenceService.startTyping(chatId);
    }

    // Reset typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 2000);
  }

  public stopTyping(): void {
    if (this.isTyping) {
      this.isTyping = false;
      const chatId = this.route.snapshot.queryParams['chatId'];
      this.presenceService.stopTyping(chatId);
    }

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  public addReaction(messageId: number, reaction: string): void {
    this.chatService.addMessageReaction(messageId, reaction);
  }

  public replyTo(message: Message): void {
    this.replyToMessage = message;
    this.messageInput.nativeElement.focus();
  }

  public cancelReply(): void {
    this.replyToMessage = null;
  }

  public onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  public removeSelectedFile(): void {
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  public onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  public loadMoreMessages(): void {
    if (!this.hasMoreMessages || this.isLoading) {
      return;
    }

    this.currentPage++;
    const chatId = this.route.snapshot.queryParams['chatId'];
    
    this.chatService.getChatMessages(chatId, this.currentPage, this.pageSize)
      .subscribe({
        next: (messages) => {
          if (messages.length > 0) {
            this.messages = [...messages.reverse(), ...this.messages];
            this.hasMoreMessages = messages.length === this.pageSize;
          } else {
            this.hasMoreMessages = false;
          }
        },
        error: (error) => {
          console.error('Error loading more messages:', error);
          this.currentPage--; // Revert page increment on error
        }
      });
  }

  public getTypingText(): string {
    if (this.typingUsers.length === 0) {
      return '';
    } else if (this.typingUsers.length === 1) {
      return `${this.typingUsers[0]} is typing...`;
    } else if (this.typingUsers.length === 2) {
      return `${this.typingUsers[0]} and ${this.typingUsers[1]} are typing...`;
    } else {
      return `${this.typingUsers.length} people are typing...`;
    }
  }

  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public trackByMessageId(index: number, message: Message): number {
    return message.id;
  }

  public getMessageReactions(message: Message): Array<{emoji: string, count: number}> {
    if (!message.reactions) {
      return [];
    }

    const reactionCounts: { [emoji: string]: number } = {};
    Object.values(message.reactions).forEach(emoji => {
      reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
    });

    return Object.entries(reactionCounts).map(([emoji, count]) => ({
      emoji,
      count
    }));
  }
}
