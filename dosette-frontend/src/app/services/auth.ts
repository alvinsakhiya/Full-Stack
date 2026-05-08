import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = `${API_BASE_URL}/auth`;

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, data).pipe(
      tap((response) => {
        if (response?.token) {
          this.saveToken(response.token);
        }

        if (response?.role) {
          this.saveRole(response.role);
        }

        if (response?.user) {
          this.saveUser(response.user);
        }
      })
    );
  }

  register(data: { email: string; password: string; role: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  getMe(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/me`);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => this.removeToken())
    );
  }

  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  saveRole(role: string): void {
    localStorage.setItem('role', role);
  }

  saveUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  removeToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
  }

  clearSession(): void {
    this.removeToken();
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(roles: string[]): boolean {
    const role = this.getRole();
    return !!role && roles.includes(role);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  checkEmail(email: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/check-email?email=${email}`);
  }

  auth0Login(data: { email: string; name: string; avatar: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth0-login`, data).pipe(
      tap((response) => {
        if (response?.token) {
          this.saveToken(response.token);
        }

        if (response?.role) {
          this.saveRole(response.role);
        }

        if (response?.user) {
          this.saveUser(response.user);
        }
      })
    );
  }
}