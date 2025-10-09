import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppointmentsRoutingModule } from './appointments-routing.module';
import { SharedModule } from '../shared/shared.module';

import { AppointmentListComponent } from './appointment-list/appointment-list.component';
import { AppointmentBookingComponent } from './appointment-booking/appointment-booking.component';
import { DoctorSearchComponent } from './doctor-search/doctor-search.component';
import { AppointmentDetailsComponent } from './appointment-details/appointment-details.component';
import { AppointmentCalendarComponent } from './appointment-calendar/appointment-calendar.component';

@NgModule({
  declarations: [
    AppointmentListComponent,
    AppointmentBookingComponent,
    DoctorSearchComponent,
    AppointmentDetailsComponent,
    AppointmentCalendarComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    AppointmentsRoutingModule,
    SharedModule
  ],
  exports: [
    AppointmentListComponent,
    AppointmentBookingComponent,
    DoctorSearchComponent,
    AppointmentDetailsComponent,
    AppointmentCalendarComponent
  ]
})
export class AppointmentsModule { }
