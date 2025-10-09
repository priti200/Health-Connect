import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards/auth.guard';

import { VideoConsultationComponent } from './video-consultation/video-consultation.component';
import { ConsultationListComponent } from './consultation-list/consultation-list.component';
import { ConsultationRoomComponent } from './consultation-room/consultation-room.component';
import { DoctorConsultationDashboardComponent } from './doctor-consultation-dashboard/doctor-consultation-dashboard.component';
import { PatientConsultationDashboardComponent } from './patient-consultation-dashboard/patient-consultation-dashboard.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'consultations', pathMatch: 'full' },
      { path: 'consultations', component: ConsultationListComponent },
      { path: 'doctor-dashboard', component: DoctorConsultationDashboardComponent },
      { path: 'patient-dashboard', component: PatientConsultationDashboardComponent },
      { path: 'consultation/:id', component: VideoConsultationComponent },
      { path: 'room/:roomId', component: ConsultationRoomComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TelemedicineRoutingModule { }
