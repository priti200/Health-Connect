import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards/auth.guard';

import { AppointmentListComponent } from './appointment-list/appointment-list.component';
import { AppointmentBookingComponent } from './appointment-booking/appointment-booking.component';
import { DoctorSearchComponent } from './doctor-search/doctor-search.component';
import { AppointmentDetailsComponent } from './appointment-details/appointment-details.component';
import { AppointmentCalendarComponent } from './appointment-calendar/appointment-calendar.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: AppointmentListComponent },
      { path: 'calendar', component: AppointmentCalendarComponent },
      { path: 'book', component: AppointmentBookingComponent },
      { path: 'doctors', component: DoctorSearchComponent },
      { path: ':id', component: AppointmentDetailsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppointmentsRoutingModule { }
