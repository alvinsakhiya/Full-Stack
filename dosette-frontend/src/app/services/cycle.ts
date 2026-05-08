import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

@Injectable({
  providedIn: 'root'
})
export class CycleService {
  private http = inject(HttpClient);
  private baseUrl = `${API_BASE_URL}/cycles`;

  createCycle(data: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, data);
  }

  getCycles(page = 1, limit = 1000): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}?page=${page}&limit=${limit}`);
  }

  updateStatus(id: string, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}/status`, { status });
  }
}