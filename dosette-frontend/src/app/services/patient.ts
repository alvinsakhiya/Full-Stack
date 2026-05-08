import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private http = inject(HttpClient);
  private baseUrl = `${API_BASE_URL}/patients`;

  getPatients(page = 1, limit = 10, search = ''): Observable<any> {
    let url = `${this.baseUrl}?page=${page}&limit=${limit}`;

    if (search.trim()) {
      url += `&search=${search}`;
    }

    return this.http.get<any>(url);
  }

  deletePatient(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  getPatient(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  createPatient(data: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, data);
  }

  updatePatient(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, data);
  }
}