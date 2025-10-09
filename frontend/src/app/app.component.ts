import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { User } from './core/models/user.model';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'HealthConnect';
  currentUser: User | null = null;
  showNavigation = false;

  // Navigation state properties
  isUserMenuOpen = false;
  isMobileMenuOpen = false;

  // Badge counters
  upcomingAppointments = 0;
  todayAppointments = 0;
  unreadMessages = 0;

  // Status indicators
  isVideoCallActive = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.updateNavigationVisibility();
    });

    // Subscribe to route changes to determine if navigation should be shown
    this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateNavigationVisibility();
      });
  }

  private updateNavigationVisibility(): void {
    const isAuthRoute = this.router.url.includes('/auth');
    const isAuthenticated = this.authService.isAuthenticated();
    this.showNavigation = !isAuthRoute && isAuthenticated && !!this.currentUser;
  }

  logout(): void {
    this.authService.logout();
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToDashboard(): void {
    if (this.currentUser?.role === 'DOCTOR') {
      this.router.navigate(['/doctor/dashboard']);
    } else if (this.currentUser?.role === 'PATIENT') {
      this.router.navigate(['/patient/dashboard']);
    }
  }

  // Navigation helper methods
  isActiveRoute(route: string): boolean {
    return this.router.url.includes(route);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // User display methods
  getInitials(fullName: string): string {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getUserRoleDisplay(): string {
    if (!this.currentUser?.role) return '';
    return this.currentUser.role.charAt(0).toUpperCase() +
           this.currentUser.role.slice(1).toLowerCase();
  }

  getUserStatusClass(): string {
    // For now, return 'online' - this could be connected to a real status service
    return 'online';
  }

  getRoleBadgeClass(): string {
    if (!this.currentUser?.role) return '';
    return this.currentUser.role.toLowerCase();
  }
}
