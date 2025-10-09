import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl + '/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Check for existing token on service initialization
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();
    const userData = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');

    if (token && userData && !this.isTokenExpired(token)) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.clearAuthData();
      }
    } else {
      // Clear invalid/expired data without navigation
      this.clearAuthData();
    }
  }

  private clearAuthData(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, request)
      .pipe(
        tap(response => {
          if (response.token) {
            this.setAuthData(response);
          }
        }),
        catchError(this.handleError)
      );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, request)
      .pipe(
        tap(response => {
          if (response.token) {
            this.setAuthData(response);
          }
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    // Clear authentication data
    this.clearAuthData();

    // Navigate to login only if not already on auth page
    if (!this.router.url.includes('/auth')) {
      this.router.navigate(['/auth/login']);
    }
  }

  private setAuthData(response: AuthResponse): void {
    // Store token (use sessionStorage for multi-tab testing)
    sessionStorage.setItem('token', response.token);
    localStorage.setItem('token', response.token);

    // Store user data (without token for security)
    const userData: User = {
      id: response.id,
      fullName: response.fullName,
      email: response.email,
      role: response.role,
      avatar: response.avatar || '/assets/images/default-avatar.svg',
      specialization: response.specialization,
      licenseNumber: response.licenseNumber,
      affiliation: response.affiliation,
      yearsOfExperience: response.yearsOfExperience,
      phoneNumber: response.phoneNumber,
      address: response.address,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };

    sessionStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('currentUser', JSON.stringify(userData));
    this.currentUserSubject.next(userData);
  }

  getToken(): string | null {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  public isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
