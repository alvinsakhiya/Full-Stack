import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isAuthPage: boolean = false;
  pageTitle: string = 'Dashboard';
  currentUser: any = {
    name: 'User',
    role: null
  };

  constructor(private router: Router, private authService: AuthService) {
    this.loadUser();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;

        this.updateTitle(url);
        this.isAuthPage = url.includes('login') || url.includes('register');

      }
    });
  }

  updateTitle(url: string): void {
    if (url.includes('patients')) this.pageTitle = 'Patients';
    else if (url.includes('medications')) this.pageTitle = 'Medications';
    else if (url.includes('cycles')) this.pageTitle = 'Cycles';
    else if (url.includes('picking-lists')) this.pageTitle = 'Picking Lists';
    else if (url.includes('reports')) this.pageTitle = 'Reports';
    else this.pageTitle = 'Dashboard';
  }

  getUserDisplayName(): string {
    return this.currentUser?.name || 'User';
  }

  loadUser(): void {
    this.authService.getMe().subscribe({
      next: (res: any) => {
        const user = res?.data || res?.user || res;

        this.currentUser = {
          name: user?.name || 'User',
          role: user?.role || this.authService.getRole()
        };
      },
      error: () => {
        this.currentUser = {
          name: 'User',
          role: this.authService.getRole()
        };
      }
    });
  }
}
