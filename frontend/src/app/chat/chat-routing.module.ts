import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards/auth.guard';
import { ChatLayoutComponent } from './chat-layout/chat-layout.component';
import { EnhancedChatComponent } from './enhanced-chat/enhanced-chat.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: ChatLayoutComponent
  },
  {
    path: 'enhanced',
    canActivate: [AuthGuard],
    component: EnhancedChatComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChatRoutingModule { }
