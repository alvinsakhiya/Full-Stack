import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../services/report';

@Component({
  selector: 'app-reports',
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {
  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);

  mostUsed: any[] = [];
  stock: any = null;

  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      mostUsed: this.reportService.getMostUsed(),
      stock: this.reportService.getStockValuation()
    }).subscribe({
      next: (res: any) => {
        this.mostUsed = res.mostUsed?.data || [];
        this.stock = res.stock?.data || null;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load reports';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
  trackByMedication(index: number, item: any): string {
    return item.medication_id;
  }

  trackByStock(index: number, item: any): string {
    return item.name;
  }

  clearError(): void {
    this.errorMessage = '';
  }

  refreshReports(): void {
    this.clearError();
    this.loadReports();
  }

  getTotalUsage(): number {
    if (!this.mostUsed.length) return 0;
    return this.mostUsed.reduce((sum, m) => sum + (m.total_quantity_used || 0), 0);
  }

  getTopMedicationName(): string {
    if (!this.mostUsed.length) return 'N/A';
    return this.mostUsed[0]?.medication_name || 'N/A';
  }

  getUsagePercent(value: number): number {
    if (!this.mostUsed.length) return 0;

    const max = Math.max(...this.mostUsed.map(m => m.total_quantity_used || 0));
    return max ? Math.round((value / max) * 100) : 0;
  }

  getStockValuePercent(value: number): number {
    if (!this.stock?.medications?.length) return 0;

    const max = Math.max(...this.stock.medications.map((m: any) => m.stock_value || 0));
    return max ? Math.round((value / max) * 100) : 0;
  }

  getSmartInsightTitle(): string {
    if (!this.mostUsed.length) return 'No Data Available';
    return `${this.getTopMedicationName()} is trending`;
  }

  getSmartInsightText(): string {
    if (!this.mostUsed.length) return 'Start generating cycles to see insights.';
    return `${this.getTopMedicationName()} has the highest usage across all generated dosette cycles.`;
  }

  getReportScore(): number {
    if (!this.mostUsed.length) return 0;
    return Math.min(100, 60 + this.mostUsed.length * 5);
  }

  exportCsv(): void {
    if (!this.mostUsed.length) {
      return;
    }

    const rows = [
      ['Medication', 'Total Usage'],
      ...this.mostUsed.map(m => [m.medication_name, m.total_quantity_used])
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'dosette-report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  }

  printReport(): void {
    window.print();
  }
}