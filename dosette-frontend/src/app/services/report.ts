import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api.config';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);

  getMostUsed(): any {
    return this.http.get<any>(`${API_BASE_URL}/reports/most-used-medications`);
  }

  getStockValuation(): any {
    return this.http.get<any>(`${API_BASE_URL}/reports/stock-valuation`);
  }
}