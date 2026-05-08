import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CycleService } from '../../services/cycle';
import { PatientService } from '../../services/patient';
import { FormsModule } from '@angular/forms';
import { MedicationService } from '../../services/medication';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-cycles',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cycles.html',
  styleUrl: './cycles.css'
})
export class Cycles implements OnInit {
  private cycleService = inject(CycleService);
  private patientService = inject(PatientService);
  private medicationService = inject(MedicationService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  medicationMap: any = {};
  patientMap: any = {};
  cycles: any[] = [];
  isLoading = false;
  errorMessage = '';

  search = '';
  cycleStatusFilter: 'all' | 'pending' | 'prepared' | 'collected' | 'delivered' = 'all';
  cycleTimeFilter: 'all' | 'current' | 'next' | 'completed' = 'all';

  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  filteredCycles: any[] = [];
  selectedCycle: any = null;

  currentCycleCount = 0;
  nextCycleCount = 0;
  overdueCycleCount = 0;
  showTray = false;
  trayDays: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  traySlots: string[] = ['morning', 'afternoon', 'evening', 'bedtime'];

  currentUser: { role: string | null } = {
    role: null
  };

  ngOnInit(): void {
    this.currentUser.role = this.authService.getRole();
    this.loadCycles();
    this.loadPatients();
    this.loadMedications();
  }

  applySearch(): void {
    const term = this.search.toLowerCase().trim();

    let data = [...this.cycles];

    if (term) {
      data = data.filter((c: any) => {
        const patientName = (this.patientMap[c.patient_id] || '').toLowerCase();
        const status = (c.status || '').toLowerCase();
        const weekStart = (c.week_start || '').toLowerCase();
        const weekEnd = (c.week_end || '').toLowerCase();

        return (
          patientName.includes(term) ||
          status.includes(term) ||
          weekStart.includes(term) ||
          weekEnd.includes(term)
        );
      });
    }

    if (this.cycleStatusFilter !== 'all') {
      data = data.filter((c: any) => (c.status || '').toLowerCase() === this.cycleStatusFilter);
    }

    if (this.cycleTimeFilter !== 'all') {
      data = data.filter((c: any) => {
        const label = this.getCycleLabel(c);

        if (this.cycleTimeFilter === 'current') return label === 'Current Week';
        if (this.cycleTimeFilter === 'next') return label === 'Next Cycle';
        if (this.cycleTimeFilter === 'completed') return label === 'Completed';

        return true;
      });
    }

    if (this.sortField) {
      data.sort((a: any, b: any) => {
        let valA = this.getSortValue(a, this.sortField);
        let valB = this.getSortValue(b, this.sortField);

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      data = this.sortCyclesByPriority(data);
    }

    this.filteredCycles = data;
    this.calculateCycleCounts();
  }

  onSearch(): void {
    this.applySearch();
  }

  refreshCycles(): void {
    this.loadCycles();
  }

  clearSearch(): void {
    this.search = '';
    this.cycleStatusFilter = 'all';
    this.cycleTimeFilter = 'all';
    this.applySearch();
  }

  loadPatients(): void {
    this.patientService.getPatients(1, 1000).subscribe({
      next: (res) => {
        const patients = res.data || [];

        patients.forEach((p: any) => {
          this.patientMap[p._id] = p.name;
        });
        this.cdr.detectChanges();
        this.loadCycles(); // AFTER patients loaded
      },
      error: () => {
        this.loadCycles(); // fallback
      }
    });
  }

  loadCycles(): void {
    this.isLoading = true;

    this.cycleService.getCycles().subscribe({
      next: (res) => {
        this.cycles = this.sortCyclesByPriority(res.data || []);
        this.filteredCycles = [...this.cycles];
        this.applySearch();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.error?.message || 'Failed to load cycles';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateStatus(id: string, status: string): void {
    this.cycleService.updateStatus(id, status).subscribe({
      next: () => this.loadCycles(),
      error: () => alert('Failed to update status')
    });
  }

  confirmStatusChange(cycle: any, status: string): void {
    const patientName = this.patientMap[cycle.patient_id] || 'this patient';
    const message = `Change ${patientName}'s cycle status to ${status}?`;

    if (!confirm(message)) {
      return;
    }

    this.updateStatus(cycle._id, status);
  }

  getTraySummary(cycle: any): string {
    const tray = cycle.tray_structure || {};
    const summary: string[] = [];

    for (const day of Object.keys(tray)) {
      const slots = tray[day];

      for (const slot of Object.keys(slots)) {
        const meds = slots[slot];

        if (Array.isArray(meds) && meds.length > 0) {
          summary.push(`${day} ${slot}: ${meds.length} item(s)`);
        }
      }
    }

    return summary.length > 0 ? summary.join(', ') : 'No medication schedule';
  }

  openTray(cycle: any): void {
    this.selectedCycle = cycle;
    this.showTray = true;
  }

  closeTray(): void {
    this.selectedCycle = null;
    this.showTray = false;
  }

  getSlots(dayData: any): string[] {
    return Object.keys(dayData || {});
  }


  generatePickingList(cycle: any): any[] {
    const result: any = {};
    const tray = cycle.tray_structure || {};

    for (const day of Object.keys(tray)) {
      for (const slot of Object.keys(tray[day])) {
        const meds = tray[day][slot];

        for (const med of meds) {
          const id = med.medication_id;

          if (!result[id]) {
            result[id] = 0;
          }

          result[id] += med.quantity || 1;
        }
      }
    }

    return Object.entries(result).map(([id, qty]) => ({
      medication_id: id,
      quantity: qty
    }));
  }

  loadMedications(): void {
    this.medicationService.getMedications(1, 1000).subscribe({
      next: (res) => {
        const meds = res.data || [];

        meds.forEach((m: any) => {
          this.medicationMap[m._id] = `${m.name} ${m.strength}`;
        });
        this.cdr.detectChanges();
      }
    });
  }

  trackByCycle(index: number, cycle: any): string {
    return cycle._id;
  }

  trackByDay(index: number, day: string): string {
    return day;
  }

  trackBySlot(index: number, slot: string): string {
    return slot;
  }

  trackByTrayMedication(index: number, medication: any): string {
    return medication.medication_id + '-' + index;
  }

  trackByPickingItem(index: number, item: any): string {
    return item.medication_id;
  }

  sortCycles(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.applySearch();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'bi-arrow-down-up';
    return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  getSortValue(cycle: any, field: string): any {
    if (field === 'patient') {
      return (this.patientMap[cycle.patient_id] || '').toLowerCase();
    }

    return cycle[field] || '';
  }

  sortCyclesByPriority(cycles: any[]): any[] {
    return [...cycles].sort((a, b) => {
      const priorityA = this.getCyclePriority(a);
      const priorityB = this.getCyclePriority(b);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return new Date(a.week_start).getTime() - new Date(b.week_start).getTime();
    });
  }

  getCyclePriority(cycle: any): number {
    const label = this.getCycleLabel(cycle);

    if (label === 'Current Week') return 1;
    if (label === 'Next Cycle') return 2;
    return 3;
  }

  calculateCycleCounts(): void {
    this.currentCycleCount = this.cycles.filter(c => this.getCycleLabel(c) === 'Current Week').length;
    this.nextCycleCount = this.cycles.filter(c => this.getCycleLabel(c) === 'Next Cycle').length;
    this.overdueCycleCount = this.cycles.filter(c => this.getCycleLabel(c) === 'Completed').length;
  }

  getCycleProgress(cycle: any): number {
    const status = (cycle.status || '').toLowerCase();

    switch (status) {
      case 'pending':
        return 25;
      case 'prepared':
        return 50;
      case 'collected':
        return 75;
      case 'delivered':
        return 100;
      default:
        return 10;
    }
  }
  // ===== UX IMPROVEMENTS =====

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

  getCycleLabel(cycle: any): string {
    const today = new Date();
    const start = new Date(cycle.week_start);
    const end = new Date(cycle.week_end);

    if (today >= start && today <= end) {
      return 'Current Week';
    }

    if (start > today) {
      return 'Next Cycle';
    }

    return 'Completed';
  }

  getCycleLabelClass(cycle: any): string {
    const label = this.getCycleLabel(cycle);

    switch (label) {
      case 'Current Week':
        return 'label-current';
      case 'Next Cycle':
        return 'label-next';
      case 'Completed':
        return 'label-completed';
      default:
        return '';
    }
  }

  getDaysRemaining(cycle: any): number {
    if (!cycle?.week_end) {
      return 0;
    }

    const today = new Date();
    const endDate = new Date(cycle.week_end);

    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const differenceMs = endDate.getTime() - today.getTime();
    const days = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));

    return Math.max(days, 0);
  }
  isPrivileged(): boolean {
    const role = this.currentUser?.role;
    return role === 'admin' || role === 'pharmacist';
  }

  canUpdateStatus(): boolean {
    const role = this.currentUser?.role;
    return role === 'admin' || role === 'pharmacist';
  }
}