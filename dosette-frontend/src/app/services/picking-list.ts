import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

@Injectable({
  providedIn: 'root',
})
export class PickingListService {
  private http = inject(HttpClient);
  private baseUrl = `${API_BASE_URL}/cycles`;

  // Get pending cycles for picking list
  getPickingLists(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}?status=pending`);
  }

  // Update cycle status (e.g., prepared)
  updateCycleStatus(id: string, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}/status`, { status });
  }
}
