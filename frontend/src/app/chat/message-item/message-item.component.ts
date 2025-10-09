import { Component, Input } from '@angular/core';
import { Message } from '../../core/models/chat.model';

@Component({
  selector: 'app-message-item',
  templateUrl: './message-item.component.html',
  styleUrls: ['./message-item.component.scss']
})
export class MessageItemComponent {
  @Input() message!: Message;
  @Input() isOwn: boolean = false;

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getStatusIcon(): string {
    switch (this.message.status) {
      case 'SENT':
        return 'bi-check';
      case 'DELIVERED':
        return 'bi-check2';
      case 'READ':
        return 'bi-check2-all';
      default:
        return 'bi-clock';
    }
  }

  getStatusClass(): string {
    return this.message.status === 'READ' ? 'text-primary' : 'text-muted';
  }
}
