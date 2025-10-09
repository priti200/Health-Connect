import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { 
  AiHealthBotService, 
  AiConversation, 
  ConversationType 
} from '../../core/services/ai-health-bot.service';

@Component({
  selector: 'app-conversation-history',
  templateUrl: './conversation-history.component.html',
  styleUrls: ['./conversation-history.component.scss']
})
export class ConversationHistoryComponent implements OnInit, OnDestroy {
  conversations: AiConversation[] = [];
  filteredConversations: AiConversation[] = [];
  isLoading = true;
  error = '';
  searchTerm = '';
  selectedType: ConversationType | 'ALL' = 'ALL';
  conversationTypes = Object.values(ConversationType);

  private subscriptions: Subscription[] = [];

  constructor(
    private aiHealthBotService: AiHealthBotService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadConversations(): void {
    this.isLoading = true;
    this.error = '';

    const sub = this.aiHealthBotService.getUserConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load conversations:', error);
        this.error = 'Failed to load conversation history';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onTypeFilterChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.conversations];

    // Filter by search term
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(conv => 
        conv.title.toLowerCase().includes(searchLower) ||
        conv.summary?.toLowerCase().includes(searchLower) ||
        conv.lastMessage?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by conversation type
    if (this.selectedType !== 'ALL') {
      filtered = filtered.filter(conv => conv.conversationType === this.selectedType);
    }

    this.filteredConversations = filtered;
  }

  openConversation(conversation: AiConversation): void {
    this.aiHealthBotService.setCurrentConversation(conversation);
    this.router.navigate(['/ai-health-bot/chat', conversation.id]);
  }

  startNewConversation(): void {
    this.router.navigate(['/ai-health-bot/chat']);
  }

  getConversationTypeDisplayName(type: ConversationType): string {
    return this.aiHealthBotService.getConversationTypeDisplayName(type);
  }

  getConversationTypeIcon(type: ConversationType): string {
    return this.aiHealthBotService.getConversationTypeIcon(type);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getConversationPreview(conversation: AiConversation): string {
    if (conversation.lastMessage) {
      return conversation.lastMessage.length > 100 
        ? conversation.lastMessage.substring(0, 97) + '...'
        : conversation.lastMessage;
    }
    return 'No messages yet';
  }

  refreshConversations(): void {
    this.loadConversations();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }
}
