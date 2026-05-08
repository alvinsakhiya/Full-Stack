import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  confirmPassword = '';
  role = 'dispenser';
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  emailChecking = false;
  emailAvailable: boolean | null = null;
  emailCheckMessage = '';
  private emailCheckTimer: any = null;

  isEmailFormatValid(): boolean {
    return !!this.email && this.email.includes('@');
  }

  isPasswordValid(): boolean {
    return !!this.password && this.password.length >= 6;
  }

  isConfirmPasswordValid(): boolean {
    return !!this.confirmPassword && this.confirmPassword === this.password;
  }

  getPasswordStrength(): number {
    let strength = 0;

    if (this.password.length >= 6) strength++;
    if (/[A-Z]/.test(this.password)) strength++;
    if (/[0-9]/.test(this.password)) strength++;
    if (/[^A-Za-z0-9]/.test(this.password)) strength++;

    return strength;
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();

    if (strength <= 1) return 'Weak';
    if (strength === 2 || strength === 3) return 'Medium';
    return 'Strong';
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();

    if (strength <= 1) return 'weak';
    if (strength === 2 || strength === 3) return 'medium';
    return 'strong';
  }

  isFormValid(): boolean {
    return (
      this.isEmailFormatValid() &&
      this.isPasswordValid() &&
      this.isConfirmPasswordValid() &&
      this.emailAvailable !== false &&
      !!this.role
    );
  }

  onEmailChange(): void {
    this.email = this.email.trim().toLowerCase();
    this.emailAvailable = null;
    this.emailCheckMessage = '';

    if (this.emailCheckTimer) {
      clearTimeout(this.emailCheckTimer);
    }

    if (!this.isEmailFormatValid()) {
      this.emailChecking = false;
      return;
    }

    this.emailChecking = true;

    this.emailCheckTimer = setTimeout(() => {
      this.authService.checkEmail(this.email).subscribe({
        next: (res: any) => {
          this.emailAvailable = !!res.available;
          this.emailCheckMessage = res.message || (res.available ? 'Email is available' : 'Email already registered');
          this.emailChecking = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.emailAvailable = null;
          this.emailCheckMessage = 'Unable to check email right now';
          this.emailChecking = false;
          this.cdr.detectChanges();
        }
      });
    }, 450);
  }

  onRegister(): void {
    if (this.isLoading) return;

    if (!this.isFormValid()) {
      this.errorMessage = 'Please complete the form correctly';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    // Basic validation
    if (!this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'All fields are required';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.email = this.email.trim().toLowerCase();
    this.isLoading = true;

    this.authService.register({
      email: this.email,
      password: this.password,
      role: this.role
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.emailAvailable = null;
        this.emailCheckMessage = '';
        this.successMessage = 'Account created successfully. Redirecting to login...';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message ||
          error?.error?.error?.message ||
          error?.error?.error ||
          'Registration failed. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }
}