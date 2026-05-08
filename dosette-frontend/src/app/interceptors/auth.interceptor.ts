import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  let isRedirecting = false;

  const token = authService.getToken();

  let clonedReq = req;

  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error) => {
      const isAuthRequest =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/check-email') ||
        req.url.includes('/auth/auth0-login');

      if (error.status === 401 && !isAuthRequest && !isRedirecting) {
        isRedirecting = true;

        // Token expired or invalid → logout silently
        authService.removeToken();

        router.navigate(['/login']).then(() => {
          isRedirecting = false;
        });
      }

      return throwError(() => error);
    })
  );
};