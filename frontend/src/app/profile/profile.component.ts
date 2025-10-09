import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { UserService } from '../core/services/user.service';
import { User, UpdateProfileRequest } from '../core/models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  currentUser: User | null = null;
  isLoading = false;
  isEditing = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserData();
  }

  private initializeForm(): void {
    this.profileForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }], // Email should not be editable
      phoneNumber: [''],
      address: [''],
      specialization: [''],
      affiliation: [''],
      yearsOfExperience: ['']
    });
  }

  private loadUserData(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.populateForm(user);
      }
    });
  }

  private populateForm(user: User): void {
    this.profileForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      specialization: user.specialization || '',
      affiliation: user.affiliation || '',
      yearsOfExperience: user.yearsOfExperience || ''
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.isEditing) {
      // Reset form when canceling edit
      if (this.currentUser) {
        this.populateForm(this.currentUser);
      }
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const updateRequest: UpdateProfileRequest = {
      fullName: this.profileForm.get('fullName')?.value,
      phoneNumber: this.profileForm.get('phoneNumber')?.value,
      address: this.profileForm.get('address')?.value
    };

    // Add doctor-specific fields if user is a doctor
    if (this.currentUser?.role === 'DOCTOR') {
      updateRequest.specialization = this.profileForm.get('specialization')?.value;
      updateRequest.affiliation = this.profileForm.get('affiliation')?.value;
      updateRequest.yearsOfExperience = this.profileForm.get('yearsOfExperience')?.value;
    }

    this.userService.updateProfile(updateRequest).subscribe({
      next: (updatedUser) => {
        this.isLoading = false;
        this.isEditing = false;
        this.successMessage = 'Profile updated successfully!';
        this.currentUser = updatedUser;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Failed to update profile. Please try again.';
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }
}
