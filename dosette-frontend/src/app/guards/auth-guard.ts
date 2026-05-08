import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Not logged in → redirect silently
if (!authService.isLoggedIn()) {
  router.navigate(['/login'], {
    queryParams: { returnUrl: route.url.join('/') }
  });
  return false;
}

  // Role-based check (if route has roles defined)
  const allowedRoles = route.data?.['roles'];

  if (allowedRoles && allowedRoles.length) {
    const role = authService.getRole();

    if (!role || !allowedRoles.includes(role)) {
      router.navigate(['/login']);
      return false;
    }
  }

  return true;
};