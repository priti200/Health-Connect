import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { 
  AiHealthBotService, 
  AiChatRequest, 
  AiChatResponse, 
  AiConversation, 
  AiMessage, 
  ConversationType 
} from '../../core/services/ai-health-bot.service';

@Component({
  selector: 'app-ai-chat',
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.scss']
})
export class AiChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  chatForm: FormGroup;
  currentConversation: AiConversation | null = null;
  messages: AiMessage[] = [];
  isLoading = false;
  isSending = false;
  error = '';
  conversationTypes = Object.values(ConversationType);
  selectedConversationType = ConversationType.GENERAL_HEALTH;

  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = false;

  constructor(
    private fb: FormBuilder,
    private aiHealthBotService: AiHealthBotService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.chatForm = this.fb.group({
      message: ['', [Validators.required, Validators.maxLength(2000)]],
      conversationType: [ConversationType.GENERAL_HEALTH]
    });
  }

  ngOnInit(): void {
    this.loadConversationFromRoute();
    this.subscribeToCurrentConversation();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private loadConversationFromRoute(): void {
    const conversationId = this.route.snapshot.paramMap.get('conversationId');
    if (conversationId) {
      this.loadConversation(+conversationId);
    }
  }

  private subscribeToCurrentConversation(): void {
    const sub = this.aiHealthBotService.currentConversation$.subscribe(conversation => {
      this.currentConversation = conversation;
      if (conversation) {
        this.messages = conversation.messages || [];
        this.selectedConversationType = conversation.conversationType;
        this.chatForm.patchValue({ conversationType: conversation.conversationType });
        this.shouldScrollToBottom = true;
      }
    });
    this.subscriptions.push(sub);
  }

  private loadConversation(conversationId: number): void {
    this.isLoading = true;
    this.error = '';

    const sub = this.aiHealthBotService.getConversationDetails(conversationId).subscribe({
      next: (conversation) => {
        this.aiHealthBotService.setCurrentConversation(conversation);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load conversation:', error);
        this.error = 'Failed to load conversation';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  onSendMessage(): void {
    if (this.chatForm.invalid || this.isSending) {
      return;
    }

    const message = this.chatForm.get('message')?.value?.trim();
    if (!message) {
      return;
    }

    this.isSending = true;
    this.error = '';

    const request: AiChatRequest = {
      message: message,
      conversationId: this.currentConversation?.id,
      conversationType: this.selectedConversationType,
      isNewConversation: !this.currentConversation
    };

    // Add user message to UI immediately
    const userMessage: AiMessage = {
      id: Date.now(), // Temporary ID
      content: message,
      role: 'USER',
      timestamp: new Date().toISOString()
    };
    this.messages.push(userMessage);
    this.shouldScrollToBottom = true;

    // Clear the form
    this.chatForm.patchValue({ message: '' });

    const sub = this.aiHealthBotService.sendMessage(request).subscribe({
      next: (response: AiChatResponse) => {
        // Add AI response to messages
        const aiMessage: AiMessage = {
          id: Date.now() + 1, // Temporary ID
          content: response.aiResponse,
          role: 'ASSISTANT',
          timestamp: response.timestamp
        };
        this.messages.push(aiMessage);

        // Update current conversation
        if (response.isNewConversation || !this.currentConversation) {
          // Navigate to the new conversation
          this.router.navigate(['/ai-health-bot/chat', response.conversationId]);
        }

        this.shouldScrollToBottom = true;
        this.isSending = false;
      },
      error: (error) => {
        console.error('Failed to send message:', error);
        this.error = 'Failed to send message. Please try again.';
        // Remove the user message that was added optimistically
        this.messages.pop();
        this.isSending = false;
      }
    });
    this.subscriptions.push(sub);
  }

  onNewConversation(): void {
    this.aiHealthBotService.setCurrentConversation(null);
    this.messages = [];
    this.selectedConversationType = ConversationType.GENERAL_HEALTH;
    this.chatForm.patchValue({ 
      message: '',
      conversationType: ConversationType.GENERAL_HEALTH 
    });
    this.router.navigate(['/ai-health-bot/chat']);
  }

  onConversationTypeChange(): void {
    this.selectedConversationType = this.chatForm.get('conversationType')?.value;
  }

  getConversationTypeDisplayName(type: ConversationType): string {
    return this.aiHealthBotService.getConversationTypeDisplayName(type);
  }

  getConversationTypeIcon(type: ConversationType): string {
    return this.aiHealthBotService.getConversationTypeIcon(type);
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }

  // New methods for enhanced UI functionality
  sendQuickMessage(message: string): void {
    this.chatForm.patchValue({ message: message });
    this.onSendMessage();
  }

  autoResize(event: any): void {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  clearError(): void {
    this.error = '';
  }
}
