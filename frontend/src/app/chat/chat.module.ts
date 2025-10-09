import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ChatRoutingModule } from './chat-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { ChatLayoutComponent } from './chat-layout/chat-layout.component';
import { MessageItemComponent } from './message-item/message-item.component';
import { AppointmentContextComponent } from './appointment-context/appointment-context.component';
import { EnhancedChatComponent } from './enhanced-chat/enhanced-chat.component';

@NgModule({
  declarations: [
    ChatListComponent,
    ChatWindowComponent,
    ChatLayoutComponent,
    MessageItemComponent,
    AppointmentContextComponent,
    EnhancedChatComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ChatRoutingModule,
    SharedModule
  ],
  exports: [
    ChatListComponent,
    ChatWindowComponent,
    ChatLayoutComponent,
    MessageItemComponent,
    EnhancedChatComponent
  ]
})
export class ChatModule { }
