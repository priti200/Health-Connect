import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AiHealthBotRoutingModule } from './ai-health-bot-routing.module';
import { SharedModule } from '../shared/shared.module';

import { AiChatComponent } from './ai-chat/ai-chat.component';
import { ConversationHistoryComponent } from './conversation-history/conversation-history.component';

@NgModule({
  declarations: [
    AiChatComponent,
    ConversationHistoryComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AiHealthBotRoutingModule,
    SharedModule
  ],
  exports: [
    AiChatComponent,
    ConversationHistoryComponent
  ]
})
export class AiHealthBotModule { }
