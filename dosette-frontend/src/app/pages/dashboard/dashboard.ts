import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { PatientService } from '../../services/patient';
import { MedicationService } from '../../services/medication';
import { CycleService } from '../../services/cycle';
import { ReportService } from '../../services/report';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private patientService = inject(PatientService);
  private medicationService = inject(MedicationService);
  private cycleService = inject(CycleService);
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  totalPatients = 0;
  totalMedications = 0;
  totalCycles = 0;
  pendingCycles = 0;
  preparedCycles = 0;
  deliveredCycles = 0;
  lowStockItems = 0;
  expiredItems = 0;
  totalStockValue = 0;
  mostUsed: any[] = [];
  recentCycles: any[] = [];
  lowStockPreview: any[] = [];

  // Chart values
  patientsChartWidth = 0;
  medicationsChartWidth = 0;
  cyclesChartWidth = 0;

  pendingCyclePercent = 0;
  preparedCyclePercent = 0;
  deliveredCyclePercent = 0;

  healthyStockItems = 0;
  stockHealthScore = 0;

  cycleDonutStyle = '';
  stockHealthStyle = '';

  pendingWorkloadPercent = 0;
  stockRiskPercent = 0;

  operationalScore = 0;
  operationalScoreStyle = '';

  weeklyTrend: number[] = [32, 58, 46, 72, 64, 86, 76];
  trendLabels: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  currentUser: any = null;
  isLoading = false;
  isLoggingOut = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      user: this.authService.getMe().pipe(catchError(() => of(null))),
      patients: this.patientService.getPatients(1, 1).pipe(catchError(() => of({ total: 0 }))),
      medications: this.medicationService.getMedications(1, 1000).pipe(catchError(() => of({ data: [], total: 0 }))),
      cycles: this.cycleService.getCycles(1, 1000).pipe(catchError(() => of({ data: [], total: 0 }))),
      mostUsed: this.reportService.getMostUsed().pipe(catchError(() => of({ data: [] }))),
      stock: this.reportService.getStockValuation().pipe(catchError(() => of({ data: { total_stock_value: 0 } })))
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (result: any) => {
          this.currentUser = result.user?.data || null;

          this.totalPatients = result.patients?.total || 0;

          const meds = result.medications?.data || [];
          this.totalMedications = result.medications?.total || meds.length || 0;

          const lowStockMeds = meds.filter(
            (m: any) => Number(m.stock_quantity) <= Number(m.low_stock_threshold)
          );

          this.lowStockItems = lowStockMeds.length;
          this.lowStockPreview = lowStockMeds.slice(0, 4);
          this.expiredItems = meds.filter((m: any) => this.isExpired(m.expiry_date)).length;
          this.healthyStockItems = Math.max(meds.length - this.lowStockItems - this.expiredItems, 0);

          const cycles = result.cycles?.data || [];
          this.totalCycles = result.cycles?.total || cycles.length || 0;
          this.pendingCycles = cycles.filter((c: any) => c.status === 'pending').length;
          this.preparedCycles = cycles.filter((c: any) => c.status === 'prepared').length;
          this.deliveredCycles = cycles.filter((c: any) => c.status === 'delivered').length;
          this.recentCycles = cycles.slice(0, 4);
          this.updateWeeklyTrend(cycles);

          this.mostUsed = (result.mostUsed?.data || []).slice(0, 3);
          this.totalStockValue = Number(result.stock?.data?.total_stock_value || 0);

          // ===== Chart Calculations =====
          const maxValue = Math.max(
            this.totalPatients,
            this.totalMedications,
            this.totalCycles,
            1
          );

          this.patientsChartWidth = (this.totalPatients / maxValue) * 100;
          this.medicationsChartWidth = (this.totalMedications / maxValue) * 100;
          this.cyclesChartWidth = (this.totalCycles / maxValue) * 100;

          const total = this.totalCycles || 1;
          this.pendingCyclePercent = (this.pendingCycles / total) * 100;
          this.preparedCyclePercent = (this.preparedCycles / total) * 100;
          this.deliveredCyclePercent = (this.deliveredCycles / total) * 100;

          this.cycleDonutStyle = `conic-gradient(
            #f59e0b 0% ${this.pendingCyclePercent}%,
            #10b981 ${this.pendingCyclePercent}% ${this.pendingCyclePercent + this.preparedCyclePercent}%,
            #3b82f6 ${this.pendingCyclePercent + this.preparedCyclePercent}% 100%
          )`;

          const stockTotal = meds.length || 1;
          this.stockHealthScore = (this.healthyStockItems / stockTotal) * 100;

          this.stockHealthStyle = `conic-gradient(
            #10b981 0% ${this.stockHealthScore}%,
            #ef4444 ${this.stockHealthScore}% 100%
          )`;

      
          this.pendingWorkloadPercent = (this.pendingCycles / (this.totalCycles || 1)) * 100;

          this.stockRiskPercent = (this.lowStockItems / (this.totalMedications || 1)) * 100;

          const baseScore = this.stockHealthScore;
          const workloadPenalty = this.pendingWorkloadPercent * 0.5;

          this.operationalScore = Math.max(0, Math.min(100, baseScore - workloadPenalty));

          this.operationalScoreStyle = `conic-gradient(
            #10b981 0% ${this.operationalScore}%,
            #e5e7eb ${this.operationalScore}% 100%
          )`;

          this.cdr.detectChanges();
        },
        error: () => {
          this.errorMessage = 'Some dashboard data could not be loaded.';
          this.cdr.detectChanges();
        }
      });
  }

  logout(): void {
    const confirmed = confirm('Are you sure you want to log out?');

    if (!confirmed) {
      return;
    }

    this.isLoggingOut = true;

    this.authService.logout().subscribe({
      next: () => {
        this.finishLogout();
      },
      error: () => {
        this.finishLogout();
      }
    });
  }

  finishLogout(): void {
    this.authService.removeToken();
    this.isLoggingOut = false;
    this.router.navigate(['/login']);
  }

  getUserDisplayName(): string {
    if (!this.currentUser?.email) {
      return 'Current User';
    }

    return this.currentUser.email.split('@')[0];
  }

  getUserRole(): string {
    return this.currentUser?.role || 'Unknown role';
  }

  getRoleBadgeClass(): string {
    const role = this.getUserRole();

    if (role === 'admin') {
      return 'text-bg-primary';
    }

    if (role === 'pharmacist') {
      return 'text-bg-success';
    }

    return 'text-bg-secondary';
  }

  getCycleStatusClass(status: string): string {
    if (status === 'pending') {
      return 'text-bg-warning';
    }

    if (status === 'prepared') {
      return 'text-bg-success';
    }

    if (status === 'collected') {
      return 'text-bg-primary';
    }

    if (status === 'delivered') {
      return 'text-bg-dark';
    }

    return 'text-bg-secondary';
  }

  trackByMedication(index: number, item: any): string {
    return item?.medication_id || item?._id || index.toString();
  }

  trackByCycle(index: number, item: any): string {
    return item?._id || index.toString();
  }

  trackByLowStockMedication(index: number, item: any): string {
    return item?._id || index.toString();
  }

  refreshDashboard(): void {
    this.loadDashboard();
  }

  exportDashboard(): void {
    const reportLines = [
      'Dosette Management System - Dashboard Summary',
      '---------------------------------------------',
      `Patients: ${this.totalPatients}`,
      `Medications: ${this.totalMedications}`,
      `Total cycles: ${this.totalCycles}`,
      `Pending picking: ${this.pendingCycles}`,
      `Prepared cycles: ${this.preparedCycles}`,
      `Delivered cycles: ${this.deliveredCycles}`,
      `Low stock items: ${this.lowStockItems}`,
      `Expired medicines: ${this.expiredItems}`,
      `Stock health: ${this.stockHealthScore.toFixed(0)}%`,
      `Total stock value: £${this.totalStockValue.toFixed(2)}`
    ];

    const blob = new Blob([reportLines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dashboard-summary.txt';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  updateWeeklyTrend(cycles: any[]): void {
    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    cycles.forEach((cycle: any) => {
      const rawDate = cycle.week_start || cycle.created_at || cycle.createdAt;

      if (!rawDate) {
        return;
      }

      const date = new Date(rawDate);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const jsDay = date.getDay();
      const mondayIndex = jsDay === 0 ? 6 : jsDay - 1;
      dayCounts[mondayIndex] += 1;
    });

    const maxCount = Math.max(...dayCounts, 1);

    this.weeklyTrend = dayCounts.map((count, index) => {
      if (count === 0 && this.totalCycles > 0) {
        return [28, 44, 36, 62, 54, 72, 66][index];
      }

      return Math.max((count / maxCount) * 100, count > 0 ? 18 : 8);
    });
  }

  isExpired(expiryDate: string): boolean {
    if (!expiryDate) {
      return false;
    }

    const today = new Date();
    const expiry = new Date(expiryDate);
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    return expiry < today;
  }

  formatWeekRange(start: string, end: string): string {
    if (!start || !end) return '';

    const startDate = new Date(start);
    const endDate = new Date(end);

    const startStr = startDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });

    const endStr = endDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return `Week ${startStr} – ${endStr}`;
  }

  getCycleAgeLabel(cycle: any): string {
    if (!cycle?.week_end) return '';

    const today = new Date();
    const end = new Date(cycle.week_end);

    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff > 0) return `${diff} days left`;
    if (diff === 0) return 'Ends today';
    return `${Math.abs(diff)} days overdue`;
  }

  getCycleAgeClass(cycle: any): string {
    const label = this.getCycleAgeLabel(cycle);

    if (label.includes('overdue')) return 'text-danger';
    if (label.includes('today')) return 'text-warning';
    return 'text-muted';
  }
}
