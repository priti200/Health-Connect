import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { ChatModule } from '../chat/chat.module';

import { PatientDashboardComponent } from './dashboard/dashboard.component';
import { PrescriptionAnalyzerComponent } from './components/prescription-analyzer/prescription-analyzer.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: PatientDashboardComponent
  }
];

@NgModule({
  declarations: [
    PatientDashboardComponent,
    PrescriptionAnalyzerComponent
  ],
  imports: [
    SharedModule,
    ChatModule,
    RouterModule.forChild(routes)
  ]
})
export class PatientModule { }
