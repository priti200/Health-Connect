import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Chat } from '../../core/models/chat.model';
import { User } from '../../core/models/user.model';
import { ChatService } from '../../core/services/chat.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-chat-layout',
  templateUrl: './chat-layout.component.html',
  styleUrls: ['./chat-layout.component.scss']
})
export class ChatLayoutComponent implements OnInit, OnDestroy {
  chats: Chat[] = [];
  selectedChat: Chat | null = null;
  currentUser: any;
  loading = true;
  
  // New chat modal
  showNewChatModal = false;
  availableDoctors: User[] = [];
  filteredDoctors: User[] = [];
  loadingDoctors = false;
  doctorSearchTerm = '';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private userService: UserService,
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
    this.selectedChat = chat;
    
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

  onMessageSent(): void {
    // Refresh chat list to update last message
    this.loadChats();
  }

  // New chat functionality
  openNewChatModal(): void {
    this.showNewChatModal = true;
    this.loadAvailableDoctors();
  }

  private loadAvailableDoctors(): void {
    this.loadingDoctors = true;

    if (this.currentUser?.role === 'PATIENT') {
      // Patients can chat with doctors
      this.userService.getAllDoctors().subscribe({
        next: (doctors) => {
          this.availableDoctors = doctors;
          this.filteredDoctors = doctors;
          this.loadingDoctors = false;
        },
        error: (error) => {
          console.error('Failed to load doctors:', error);
          this.loadingDoctors = false;
          this.availableDoctors = [];
          this.filteredDoctors = [];
        }
      });
    } else if (this.currentUser?.role === 'DOCTOR') {
      // Doctors can chat with patients
      this.userService.getAllPatients().subscribe({
        next: (patients) => {
          this.availableDoctors = patients; // Using same variable for simplicity
          this.filteredDoctors = patients;
          this.loadingDoctors = false;
        },
        error: (error) => {
          console.error('Failed to load patients:', error);
          this.loadingDoctors = false;
          this.availableDoctors = [];
          this.filteredDoctors = [];
        }
      });
    } else {
      console.error('Unknown user role:', this.currentUser?.role);
      this.loadingDoctors = false;
      this.availableDoctors = [];
      this.filteredDoctors = [];
    }
  }

  filterDoctors(): void {
    if (!this.doctorSearchTerm.trim()) {
      this.filteredDoctors = this.availableDoctors;
      return;
    }

    const searchTerm = this.doctorSearchTerm.toLowerCase();
    this.filteredDoctors = this.availableDoctors.filter(doctor =>
      doctor.fullName.toLowerCase().includes(searchTerm) ||
      doctor.specialization?.toLowerCase().includes(searchTerm)
    );
  }

  startChatWithDoctor(contact: User): void {
    this.loadingDoctors = true;

    console.log('Starting chat with contact:', {
      currentUser: this.currentUser,
      contact: contact,
      contactId: contact.id,
      isAuthenticated: this.authService.isAuthenticated(),
      token: this.authService.getToken()
    });

    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      console.error('User is not authenticated');
      alert('You are not logged in. Please log in again.');
      this.loadingDoctors = false;
      this.authService.logout();
      return;
    }

    // Check if contact ID exists
    if (!contact.id) {
      console.error('Contact ID is missing:', contact);
      alert('Error: Contact ID is missing. Please try again.');
      this.loadingDoctors = false;
      return;
    }

    this.chatService.createOrGetChat(contact.id).subscribe({
      next: (chat) => {
        this.showNewChatModal = false;
        this.loadingDoctors = false;
        this.doctorSearchTerm = '';

        // Add the new chat to the list if it's not already there
        const existingChatIndex = this.chats.findIndex(c => c.id === chat.id);
        if (existingChatIndex === -1) {
          this.chats.unshift(chat);
        }

        // Select the chat
        this.selectChat(chat);
      },
      error: (error) => {
        console.error('Failed to create chat:', error);
        this.loadingDoctors = false;

        let errorMessage = 'Failed to create chat. Please try again.';

        if (error.status === 400) {
          if (error.error?.error) {
            errorMessage = error.error.error;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
        } else if (error.status === 403) {
          errorMessage = 'Access denied. Please check if you are logged in with the correct account.';
          this.authService.logout();
        } else if (error.status === 409) {
          errorMessage = 'A chat with this contact already exists.';
        }

        alert(errorMessage);
      }
    });
  }
}
