import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { TelemedicineRoutingModule } from './telemedicine-routing.module';
import { SharedModule } from '../shared/shared.module';

// Components
import { ConsultationListComponent } from './consultation-list/consultation-list.component';
import { VideoConsultationComponent } from './video-consultation/video-consultation.component';
import { ConsultationRoomComponent } from './consultation-room/consultation-room.component';
import { DoctorConsultationDashboardComponent } from './doctor-consultation-dashboard/doctor-consultation-dashboard.component';
import { PatientConsultationDashboardComponent } from './patient-consultation-dashboard/patient-consultation-dashboard.component';

@NgModule({
  declarations: [
    ConsultationListComponent,
    VideoConsultationComponent,
    ConsultationRoomComponent,
    DoctorConsultationDashboardComponent,
    PatientConsultationDashboardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TelemedicineRoutingModule,
    SharedModule
  ],
  exports: [
    ConsultationListComponent,
    VideoConsultationComponent,
    ConsultationRoomComponent
  ]
})
export class TelemedicineModule { }
