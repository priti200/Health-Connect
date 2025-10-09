import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'patient',
    canActivate: [AuthGuard],
    data: { roles: ['PATIENT'] },
    loadChildren: () => import('./patient/patient.module').then(m => m.PatientModule)
  },
  {
    path: 'doctor',
    canActivate: [AuthGuard],
    data: { roles: ['DOCTOR'] },
    loadChildren: () => import('./doctor/doctor.module').then(m => m.DoctorModule)
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule)
  },
  {
    path: 'appointments',
    canActivate: [AuthGuard],
    data: { roles: ['PATIENT'] },
    loadChildren: () => import('./appointments/appointments.module').then(m => m.AppointmentsModule)
  },
  {
    path: 'chat',
    canActivate: [AuthGuard],
    loadChildren: () => import('./chat/chat.module').then(m => m.ChatModule)
  },
  {
    path: 'ai-health-bot',
    canActivate: [AuthGuard],
    data: { roles: ['PATIENT'] },
    loadChildren: () => import('./ai-health-bot/ai-health-bot.module').then(m => m.AiHealthBotModule)
  },
  {
    path: 'telemedicine',
    canActivate: [AuthGuard],
    loadChildren: () => import('./telemedicine/telemedicine.module').then(m => m.TelemedicineModule)
  },
  {
    path: 'debug',
    canActivate: [AuthGuard],
    loadChildren: () => import('./debug/debug.module').then(m => m.DebugModule)
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
