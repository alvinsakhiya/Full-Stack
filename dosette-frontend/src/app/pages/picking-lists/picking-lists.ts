import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CycleService } from '../../services/cycle';
import { PatientService } from '../../services/patient';
import { MedicationService } from '../../services/medication';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-picking-lists',
  imports: [CommonModule, FormsModule],
  templateUrl: './picking-lists.html',
  styleUrl: './picking-lists.css'
})
export class PickingLists implements OnInit {
  private cycleService = inject(CycleService);
  private patientService = inject(PatientService);
  private medicationService = inject(MedicationService);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  cycles: any[] = [];
  filteredCycles: any[] = [];
  patientMap: any = {};
  medicationMap: any = {};
  search = '';
  isLoading = false;
  errorMessage = '';
  updatingCycleId = '';
  stockFilter: 'all' | 'warning' | 'safe' = 'all';
  lowStockCycleCount = 0;
  totalPickingItems = 0;
  todayLabel = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  currentUser: { role: string | null } = {
    role: null
  };

  ngOnInit(): void {
    this.currentUser.role = this.authService.getRole();
    this.loadPatients();
    this.loadMedications();

    setTimeout(() => {
      this.loadCycles();
    }, 0);
  }

  loadPatients(): void {
    this.patientService.getPatients(1, 1000).subscribe({
      next: (res) => {
        for (const p of res.data || []) {
          this.patientMap[p._id] = p.name;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        // Dispenser users may not have patient endpoint access.
        // Keep picking list functional and show IDs/fallback labels instead.
        this.patientMap = {};
        this.cdr.detectChanges();
      }
    });
  }

  loadMedications(): void {
    this.medicationService.getMedications(1, 1000).subscribe({
      next: (res) => {
        for (const m of res.data || []) {
          this.medicationMap[m._id] = {
            name: `${m.name} ${m.strength}`,
            strength: m.strength,
            stock: m.stock_quantity
          };
        }
        this.cdr.detectChanges();
      },
      error: () => {
        // Dispenser users may not have medication endpoint access.
        // Keep picking list functional and show medication IDs/fallback labels instead.
        this.medicationMap = {};
        this.cdr.detectChanges();
      }
    });
  }
  canMarkReady(): boolean {
    const role = this.currentUser?.role;
    return role === 'admin' || role === 'pharmacist';
  }


  populateMedicationMapFromCycle(cycle: any): void {
    const tray = cycle.tray_structure || {};

    for (const day of Object.keys(tray)) {
      for (const slot of Object.keys(tray[day])) {
        for (const med of tray[day][slot] || []) {
          const id = med.medication_id;

          if (!id) continue;

          this.medicationMap[id] = {
            name: `${med.medication_name || 'Unknown Medication'} ${med.strength || ''}`.trim(),
            strength: med.strength || '',
            stock: med.stock_quantity ?? this.medicationMap[id]?.stock ?? 0
          };
        }
      }
    }
  }

  loadCycles(): void {
    this.isLoading = true;

    this.cycleService.getCycles(1, 1000).subscribe({
      next: (res) => {
        const loadedCycles = res.data || [];

        for (const cycle of loadedCycles) {
          if (cycle.patient_id && cycle.patient_name) {
            this.patientMap[cycle.patient_id] = cycle.patient_name;
          }

          this.populateMedicationMapFromCycle(cycle);
        }

        this.cycles = loadedCycles.filter((c: any) => c.status === 'pending');
        this.filteredCycles = [...this.cycles];
        this.applySearch();
        this.calculateSummary();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.error?.message || 'Failed to load picking lists';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applySearch(): void {
    const term = this.search.toLowerCase().trim();

    let data = [...this.cycles];

    if (term) {
      data = data.filter((cycle: any) => {
        const patientName = (this.patientMap[cycle.patient_id] || cycle.patient_name || '').toLowerCase();
        const weekStart = (cycle.week_start || '').toLowerCase();
        const weekEnd = (cycle.week_end || '').toLowerCase();

        return (
          patientName.includes(term) ||
          weekStart.includes(term) ||
          weekEnd.includes(term)
        );
      });
    }

    if (this.stockFilter !== 'all') {
      data = data.filter(cycle => {
        const hasWarning = this.cycleHasLowStock(cycle);
        return this.stockFilter === 'warning' ? hasWarning : !hasWarning;
      });
    }

    this.filteredCycles = data;
    this.calculateSummary();
  }

  onSearch(): void {
    this.applySearch();
  }

  clearSearch(): void {
    this.search = '';
    this.stockFilter = 'all';
    this.applySearch();
  }

  refreshPickingLists(): void {
    this.loadCycles();
  }

  generatePickingList(cycle: any): any[] {
    const result: any = {};
    const tray = cycle.tray_structure || {};

    for (const day of Object.keys(tray)) {
      for (const slot of Object.keys(tray[day])) {
        for (const med of tray[day][slot]) {
          const id = med.medication_id;

          if (!result[id]) {
            result[id] = 0;
          }

          result[id] += med.quantity || 1;
        }
      }
    }

    return Object.entries(result).map(([id, quantity]) => ({
      medication_id: id,
      quantity
    }));
  }

  isLowStock(item: any): boolean {
    const med = this.medicationMap[item.medication_id];

    if (!med || med.stock === undefined || med.stock === null) {
      return false;
    }

    return Number(item.quantity) > Number(med.stock);
  }

  cycleHasLowStock(cycle: any): boolean {
    const items = this.generatePickingList(cycle);
    return items.some(item => this.isLowStock(item));
  }

  getMedicationStock(medId: string): number {
    return this.medicationMap[medId]?.stock ?? 0;
  }

  calculateSummary(): void {
    this.lowStockCycleCount = this.cycles.filter(c => this.cycleHasLowStock(c)).length;

    this.totalPickingItems = this.cycles.reduce((total, cycle) => {
      return total + this.generatePickingList(cycle).length;
    }, 0);
  }

  getPickingProgress(cycle: any): number {
    const items = this.generatePickingList(cycle);
    if (items.length === 0) return 0;

    const safe = items.filter(item => !this.isLowStock(item)).length;
    return Math.round((safe / items.length) * 100);
  }

  formatWeekRange(start: string, end: string): string {
    if (!start || !end) return '';

    const s = new Date(start);
    const e = new Date(end);

    const sText = s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const eText = e.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    return `Week ${sText} – ${eText}`;
  }

  trackByCycle(index: number, cycle: any): string {
    return cycle._id;
  }

  trackByPickingItem(index: number, item: any): string {
    return item.medication_id;
  }

  clearError(): void {
    this.errorMessage = '';
  }

  markReadyToPrepare(cycleId: string): void {
    if (!this.canMarkReady()) {
      alert('Permission required');
      return;
    }

    const confirmed = confirm('Mark this picking list as ready to prepare?');

    if (!confirmed) {
      return;
    }

    this.updatingCycleId = cycleId;

    this.cycleService.updateStatus(cycleId, 'prepared').subscribe({
      next: () => {
        this.updatingCycleId = '';
        this.loadCycles();
        this.cdr.detectChanges();
      },
      error: () => {
        this.updatingCycleId = '';
        this.cdr.detectChanges();
        alert('Failed to update cycle status');
      }
    });
  }
  printLabels(cycle: any): void {
    const patientName = this.patientMap[cycle.patient_id] || cycle.patient_name || 'Unknown Patient';
    const items = this.generatePickingList(cycle);

    let labels = '';

    for (const item of items) {
      const medication = this.medicationMap[item.medication_id];
      const medName = medication?.name || item.medication_id;
      const strength = medication?.strength || '';

      labels += `
        <div class="label">
          <div class="label-title">Dosette Label</div>

          <div class="label-body">
            <strong>${patientName}</strong>
            <span>${medName}</span>
            <small>${strength}</small>
          </div>

          <div class="label-footer">
            <span>Qty: ${item.quantity}</span>
            <span>${this.formatWeekRange(cycle.week_start, cycle.week_end)}</span>
          </div>
        </div>
      `;
    }

    const printContent = `
      <html>
        <head>
          <title>Dosette Labels</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm;
            }

            body {
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
              color: #111827;
            }

            .sheet {
              display: grid;
              grid-template-columns: repeat(2, 70mm);
              gap: 6mm;
            }

            .label {
              width: 70mm;
              height: 36mm;
              border: 1px solid #111827;
              border-radius: 3mm;
              padding: 4mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .label-title {
              font-size: 8pt;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 1px solid #d1d5db;
              padding-bottom: 2mm;
            }

            .label-body {
              display: grid;
              gap: 1mm;
            }

            .label-body strong {
              font-size: 11pt;
              font-weight: 900;
              line-height: 1.1;
            }

            .label-body span {
              font-size: 9pt;
              font-weight: 800;
              line-height: 1.15;
            }

            .label-body small {
              font-size: 8pt;
              font-weight: 700;
            }

            .label-footer {
              display: flex;
              justify-content: space-between;
              gap: 3mm;
              font-size: 7pt;
              font-weight: 800;
              border-top: 1px solid #d1d5db;
              padding-top: 2mm;
            }
          </style>
        </head>

        <body>
          <div class="sheet">
            ${labels}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      return;
    }

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  printCycle(cycle: any): void {
    const patientName = this.patientMap[cycle.patient_id] || cycle.patient_name || 'Unknown Patient';
    const items = this.generatePickingList(cycle);

    let rows = '';

    for (const item of items) {
      const medName = this.medicationMap[item.medication_id]?.name || item.medication_id;
      const stock = this.medicationMap[item.medication_id]?.stock ?? 'Unknown';
      const isLow = Number(item.quantity) > Number(stock);

      rows += `
        <tr style="background:${isLow ? '#fef2f2' : 'transparent'}">
          <td>${medName}</td>
          <td><strong>${item.quantity}</strong></td>
          <td>${stock}</td>
        </tr>
      `;
    }

    const printContent = `
      <html>
        <head>
          <title>Picking List</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
              padding: 32px;
              color: #1d1d1f;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 24px;
            }

            .title {
              font-size: 26px;
              font-weight: 900;
            }

            .meta {
              font-size: 12px;
              color: #6e6e73;
              text-align: right;
            }

            .patient-box {
              padding: 14px;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              margin-bottom: 20px;
            }

            .patient-box strong {
              display: block;
              font-size: 16px;
              margin-bottom: 4px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }

            th, td {
              border: 1px solid #e5e7eb;
              padding: 10px;
              text-align: left;
            }

            th {
              background: #f9fafb;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }

            .signoff {
              margin-top: 40px;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 30px;
            }

            .signoff div {
              font-size: 12px;
            }

            .line {
              margin-top: 30px;
              border-top: 1px solid #000;
              height: 1px;
            }
          </style>
        </head>

        <body>
          <div class="header">
            <div class="title">Dosette Picking List</div>
            <div class="meta">
              Printed: ${this.todayLabel}<br>
              Status: Pending
            </div>
          </div>

          <div class="patient-box">
            <strong>${patientName}</strong>
            Week: ${this.formatWeekRange(cycle.week_start, cycle.week_end)}
          </div>

          <table>
            <thead>
              <tr>
                <th>Medication</th>
                <th>Qty Required</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="signoff">
            <div>
              Picked by
              <div class="line"></div>
            </div>
            <div>
              Checked by
              <div class="line"></div>
            </div>
            <div>
              Date
              <div class="line"></div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }
  printAll(): void {
    for (const cycle of this.filteredCycles) {
      this.printCycle(cycle);
    }
  }
}