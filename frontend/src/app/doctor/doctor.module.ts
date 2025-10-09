import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { ChatModule } from '../chat/chat.module';

import { DoctorDashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DoctorDashboardComponent
  }
];

@NgModule({
  declarations: [
    DoctorDashboardComponent
  ],
  imports: [
    SharedModule,
    ChatModule,
    RouterModule.forChild(routes)
  ]
})
export class DoctorModule { }
