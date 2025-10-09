import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { Appointment, AppointmentStatus } from '../../core/models/appointment.model';
import { User } from '../../core/models/user.model';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
}

@Component({
  selector: 'app-appointment-calendar',
  templateUrl: './appointment-calendar.component.html',
  styleUrls: ['./appointment-calendar.component.scss']
})
export class AppointmentCalendarComponent implements OnInit {
  currentDate = new Date();
  currentMonth = new Date();
  calendarDays: CalendarDay[] = [];
  appointments: Appointment[] = [];
  currentUser: User | null = null;
  loading = false;
  error: string | null = null;

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadAppointments();
    this.generateCalendar();
  }

  loadAppointments(): void {
    this.loading = true;
    this.error = null;

    // Get appointments for the current month
    const startDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const endDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);

    this.appointmentService.getAppointments(
      undefined, // status
      undefined, // type
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ).subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.generateCalendar();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load appointments.';
        this.loading = false;
        console.error('Error loading appointments:', error);
      }
    });
  }

  generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End at the last Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    this.calendarDays = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayAppointments = this.getAppointmentsForDate(currentDate);
      
      this.calendarDays.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: this.isSameDay(currentDate, new Date()),
        appointments: dayAppointments
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  getAppointmentsForDate(date: Date): Appointment[] {
    const dateString = date.toISOString().split('T')[0];
    return this.appointments.filter(appointment => appointment.date === dateString);
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.loadAppointments();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.loadAppointments();
  }

  goToToday(): void {
    this.currentMonth = new Date();
    this.loadAppointments();
  }

  onDayClick(day: CalendarDay): void {
    if (day.appointments.length > 0) {
      // If there are appointments, show the first one
      this.router.navigate(['/appointments', day.appointments[0].id]);
    } else if (day.isCurrentMonth && day.date >= new Date()) {
      // If it's a future date in current month, navigate to booking
      this.router.navigate(['/appointments/book'], {
        queryParams: { date: day.date.toISOString().split('T')[0] }
      });
    }
  }

  getStatusDisplayName(status: AppointmentStatus): string {
    return this.appointmentService.getStatusDisplayName(status);
  }

  getStatusBadgeClass(status: AppointmentStatus): string {
    return this.appointmentService.getStatusBadgeClass(status);
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getCurrentMonthYear(): string {
    return `${this.monthNames[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
  }

  isDoctor(): boolean {
    return this.currentUser?.role === 'DOCTOR';
  }

  isPatient(): boolean {
    return this.currentUser?.role === 'PATIENT';
  }
}
