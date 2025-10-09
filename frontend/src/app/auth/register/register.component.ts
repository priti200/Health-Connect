import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../core/models/user.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  selectedRole: 'PATIENT' | 'DOCTOR' = 'PATIENT';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.redirectToDashboard();
      return;
    }

    this.initializeForm();
  }

  private initializeForm(): void {
    this.registerForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['PATIENT', [Validators.required]],
      phoneNumber: [''],
      address: [''],
      
      // Doctor-specific fields
      specialization: [''],
      licenseNumber: [''],
      affiliation: [''],
      yearsOfExperience: ['']
    }, { validators: this.passwordMatchValidator });

    // Watch for role changes
    this.registerForm.get('role')?.valueChanges.subscribe(role => {
      this.selectedRole = role;
      this.updateValidators();
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      if (confirmPassword?.errors?.['passwordMismatch']) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    return null;
  }

  private updateValidators(): void {
    const specialization = this.registerForm.get('specialization');
    const licenseNumber = this.registerForm.get('licenseNumber');

    if (this.selectedRole === 'DOCTOR') {
      specialization?.setValidators([Validators.required]);
      licenseNumber?.setValidators([Validators.required]);
    } else {
      specialization?.clearValidators();
      licenseNumber?.clearValidators();
    }

    specialization?.updateValueAndValidity();
    licenseNumber?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (!this.registerForm || this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const registerRequest: RegisterRequest = this.registerForm.value;

    this.authService.register(registerRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Registration successful! Redirecting to dashboard...';
        
        // Redirect after a short delay
        setTimeout(() => {
          this.redirectToDashboard();
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Registration failed. Please try again.';
      }
    });
  }

  private redirectToDashboard(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      if (user.role === 'DOCTOR') {
        this.router.navigate(['/doctor/dashboard']);
      } else if (user.role === 'PATIENT') {
        this.router.navigate(['/patient/dashboard']);
      } else {
        this.router.navigate(['/']);
      }
    }
  }

  private markFormGroupTouched(): void {
    if (!this.registerForm) {
      return;
    }
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    if (!this.registerForm) {
      return false;
    }
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    if (!this.registerForm) {
      return '';
    }
    const field = this.registerForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldDisplayName(fieldName)} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      fullName: 'Full Name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      phoneNumber: 'Phone Number',
      specialization: 'Specialization',
      licenseNumber: 'License Number',
      affiliation: 'Affiliation',
      yearsOfExperience: 'Years of Experience'
    };
    return displayNames[fieldName] || fieldName;
  }
}
