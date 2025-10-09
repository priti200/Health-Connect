import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { User, UpdateProfileRequest } from '../models/user.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = environment.apiUrl + '/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/me`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateProfile(request: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/me`, request, {
      headers: this.getHeaders()
    }).pipe(
      tap(updatedUser => {
        // Update the current user in auth service
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          const updatedCurrentUser = { ...currentUser, ...updatedUser };
          localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
        }
      }),
      catchError(this.handleError)
    );
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getAllDoctors(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/doctors`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getAllPatients(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/patients`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  searchDoctors(specialization?: string): Observable<User[]> {
    let params = new HttpParams();
    if (specialization) {
      params = params.set('specialization', specialization);
    }
    return this.http.get<User[]>(`${this.API_URL}/doctors`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      catchError(this.handleError)
    );
  }

  getDoctorById(id: number): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/doctors/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getSpecializations(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/doctors/specializations`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
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
