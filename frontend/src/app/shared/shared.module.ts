import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ChatAccessComponent } from './components/chat-access/chat-access.component';
import { DoctorAvailabilityComponent } from './components/doctor-availability/doctor-availability.component';
import { NotificationBellComponent } from './components/notification-bell/notification-bell.component';
import { QuickChatWidgetComponent } from './components/quick-chat-widget/quick-chat-widget.component';
import { LanguageSelectorComponent } from './components/language-selector/language-selector.component';
import { InsuranceCoverageComponent } from './components/insurance-coverage/insurance-coverage.component';
import { WebSocketStatusComponent } from './components/websocket-status/websocket-status.component';
import { WebSocketTestComponent } from './components/websocket-test/websocket-test.component';
import { ChatStressTestComponent } from './components/chat-stress-test/chat-stress-test.component';
import { SecurityNoticeComponent } from './components/security-notice/security-notice.component';
import { HealthConnectLogoComponent } from './components/healthconnect-logo/healthconnect-logo.component';

@NgModule({
  declarations: [
    ChatAccessComponent,
    DoctorAvailabilityComponent,
    NotificationBellComponent,
    QuickChatWidgetComponent,
    LanguageSelectorComponent,
    InsuranceCoverageComponent,
    WebSocketStatusComponent,
    WebSocketTestComponent,
    ChatStressTestComponent,
    SecurityNoticeComponent,
    HealthConnectLogoComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    HttpClientModule
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    HttpClientModule,
    ChatAccessComponent,
    DoctorAvailabilityComponent,
    NotificationBellComponent,
    QuickChatWidgetComponent,
    LanguageSelectorComponent,
    InsuranceCoverageComponent,
    WebSocketStatusComponent,
    WebSocketTestComponent,
    ChatStressTestComponent,
    SecurityNoticeComponent,
    HealthConnectLogoComponent
  ]
})
export class SharedModule { }
