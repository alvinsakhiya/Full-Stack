import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private auth0 = inject(Auth0Service);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  showPassword = false;

  ngOnInit(): void {
    // 🚀 FAST: skip everything if already logged in
    if (this.authService.getToken()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // 🚀 ONLY handle Auth0 when coming back from Google
    const isAuth0Callback =
      window.location.search.includes('code=') &&
      window.location.search.includes('state=');

    if (!isAuth0Callback) return;

    this.isLoading = true;

    this.auth0.user$.pipe(take(1)).subscribe((user: any) => {
      if (!user?.email) {
        this.isLoading = false;
        return;
      }

      const email = user.email;
      const name = user.name || email.split('@')[0];
      const avatar = user.picture || '';

      this.authService.auth0Login({ email, name, avatar }).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.errorMessage = 'Google login failed';
          this.isLoading = false;
        }
      });
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isEmailValid(): boolean {
    return !!this.email && this.email.includes('@');
  }

  isPasswordValid(): boolean {
    return !!this.password && this.password.length >= 6;
  }

  isFormValid(): boolean {
    return this.isEmailValid() && this.isPasswordValid();
  }

  onLogin(): void {
    // 🚀 prevent double click
    if (this.isLoading) return;

    // 🚀 normalize email
    this.email = this.email.trim().toLowerCase();

    if (!this.isFormValid()) {
      this.errorMessage = 'Please enter valid email and password';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        this.authService.saveToken(response.token);

        if (response.role) {
          this.authService.saveRole(response.role);
        }

        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;

        this.errorMessage =
          error?.error?.error?.message ||
          error?.error?.message ||
          'Invalid email or password';

        
        this.cdr.detectChanges();
      }
    });
  }

  loginWithGoogle(): void {
    this.auth0.loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2',
        prompt: 'select_account'
      }
    });
  }
}