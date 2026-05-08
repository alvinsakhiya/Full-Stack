import { ChangeDetectorRef, Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private auth0 = inject(Auth0Service);

  showUserMenu = false;
  currentUser: any = null;

  ngOnInit(): void {
    const role = this.authService.getRole();

    this.currentUser = {
      name: 'User',
      role: role,
      email: ''
    };

    this.cdr.detectChanges();
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.authService.getMe().subscribe({
      next: (res: any) => {
        const user = res?.data || res?.user || res;
        this.currentUser = {
          name: user?.name || user?.email?.split('@')[0] || 'User',
          role: user?.role || this.authService.getRole(),
          email: user?.email || '',
          avatar: user?.avatar || '',
          auth_provider: user?.auth_provider || ''
        };

        if (this.currentUser.role) {
          this.authService.saveRole(this.currentUser.role);
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.currentUser = {
          name: 'User',
          role: this.authService.getRole(),
          email: '',
          avatar: '',
          auth_provider: ''
        };

        this.cdr.detectChanges();
      }
    });
  }

  getUserDisplayName(): string {
    if (this.currentUser?.name && this.currentUser.name !== 'User') return this.currentUser.name;
    if (this.currentUser?.email) return this.currentUser.email.split('@')[0];
    return 'User';
  }

  getUserInitial(): string {
    return this.getUserDisplayName().charAt(0).toUpperCase();
  }

  isPrivileged(): boolean {
    const role = this.currentUser?.role;
    return role === 'admin' || role === 'pharmacist';
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout()
    });
  }

  private finishLogout(): void {
    this.authService.removeToken();

    // Logout from Auth0 as well
    this.auth0.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });

    this.router.navigate(['/login']);
  }
  @HostListener('document:click', ['$event'])
  closeUserMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.sidebar-bottom')) {
      this.showUserMenu = false;
    }
  }
}