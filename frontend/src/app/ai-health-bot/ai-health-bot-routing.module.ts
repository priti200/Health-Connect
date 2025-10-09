import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards/auth.guard';
import { AiChatComponent } from './ai-chat/ai-chat.component';
import { ConversationHistoryComponent } from './conversation-history/conversation-history.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'chat',
        pathMatch: 'full'
      },
      {
        path: 'chat',
        component: AiChatComponent,
        data: { title: 'AI Health Assistant' }
      },
      {
        path: 'chat/:conversationId',
        component: AiChatComponent,
        data: { title: 'AI Health Assistant' }
      },
      {
        path: 'history',
        component: ConversationHistoryComponent,
        data: { title: 'Conversation History' }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AiHealthBotRoutingModule { }
