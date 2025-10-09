import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    if (this.authService.isAuthenticated()) {
      // Check if the route has any role requirements
      const requiredRoles = route.data['roles'] as string[];
      if (requiredRoles && requiredRoles.length > 0) {
        // Check if the user has the required role
        const hasRequiredRole = this.authService.hasRole(requiredRoles);
        if (!hasRequiredRole) {
          // If user doesn't have the required role, redirect to appropriate dashboard
          const currentUser = this.authService.getCurrentUser();
          if (currentUser?.role === 'DOCTOR') {
            this.router.navigate(['/doctor/dashboard']);
          } else if (currentUser?.role === 'PATIENT') {
            this.router.navigate(['/patient/dashboard']);
          } else {
            this.router.navigate(['/auth/login']);
          }
          return false;
        }
      }
      return true;
    }

    // Not authenticated, redirect to login
    this.router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }
}
