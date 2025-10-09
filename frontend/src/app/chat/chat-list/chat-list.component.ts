import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { Chat } from '../../core/models/chat.model';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss']
})
export class ChatListComponent implements OnInit, OnDestroy {
  @Output() chatSelected = new EventEmitter<Chat>();
  
  chats: Chat[] = [];
  selectedChatId: number | null = null;
  currentUser: any;
  loading = true;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadChats();
    this.subscribeToChats();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadChats(): void {
    this.chatService.loadUserChats();
  }

  private subscribeToChats(): void {
    const chatsSub = this.chatService.chats$.subscribe({
      next: (chats) => {
        this.chats = chats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load chats:', error);
        this.loading = false;
      }
    });
    this.subscriptions.push(chatsSub);

    // Subscribe to new messages to update chat list
    const messagesSub = this.chatService.messages$.subscribe({
      next: (message) => {
        this.updateChatWithNewMessage(message);
      }
    });
    this.subscriptions.push(messagesSub);
  }

  private updateChatWithNewMessage(message: any): void {
    const chatIndex = this.chats.findIndex(chat => chat.id === message.chatId);
    if (chatIndex !== -1) {
      this.chats[chatIndex].lastMessage = message;
      this.chats[chatIndex].updatedAt = message.createdAt;
      
      // Increment unread count if message is not from current user
      if (message.sender.id !== this.currentUser?.id) {
        this.chats[chatIndex].unreadCount++;
      }
      
      // Move chat to top
      const chat = this.chats.splice(chatIndex, 1)[0];
      this.chats.unshift(chat);
    }
  }

  selectChat(chat: Chat): void {
    this.selectedChatId = chat.id;
    this.chatSelected.emit(chat);
    
    // Mark messages as read
    if (chat.unreadCount > 0) {
      this.chatService.markMessagesAsRead(chat.id).subscribe({
        next: () => {
          chat.unreadCount = 0;
        },
        error: (error) => {
          console.error('Failed to mark messages as read:', error);
        }
      });
    }
  }

  getOtherParticipant(chat: Chat): any {
    return this.currentUser?.role === 'PATIENT' ? chat.doctor : chat.patient;
  }

  formatLastMessageTime(dateString: string): string {
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
