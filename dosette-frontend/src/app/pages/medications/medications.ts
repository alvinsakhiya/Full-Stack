import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MedicationService } from '../../services/medication';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-medications',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './medications.html',
  styleUrl: './medications.css'
})
export class Medications implements OnInit {
  private medicationService = inject(MedicationService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  medications: any[] = [];
  filteredMedications: any[] = [];

  search = '';
  stockFilter: 'all' | 'low' | 'healthy' = 'all';
  expiryFilter: 'all' | 'expired' | 'valid' = 'all';

  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;

  isLoading = false;
  errorMessage = '';

  // Sorting
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal
  selectedMedication: any = null;

  // Inline edit
  editingMedicationId: string | null = null;
  editMedicationData: any = null;
  savingMedicationId: string | null = null;

  // Stats
  lowStockCount = 0;
  expiredCount = 0;

  currentUser: { role: string | null } = {
    role: null
  };

  ngOnInit(): void {
    this.currentUser.role = this.authService.getRole();
    this.loadMedications();
  }

  loadMedications(): void {
    this.isLoading = true;

    this.medicationService.getMedications(this.page, this.limit, this.search).subscribe({
      next: (res) => {
        this.medications = res.data || [];
        this.filteredMedications = [...this.medications];
        this.total = res.total || 0;
        this.totalPages = Math.max(Math.ceil(this.total / this.limit), 1);
        this.calculateStats();
        this.applyMedicationFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.error?.message || 'Failed to load medications';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadMedications();
  }

  deleteMedication(id: string): void {
    if (!confirm('Delete this medication?')) return;

    this.medicationService.deleteMedication(id).subscribe({
      next: () => this.loadMedications(),
      error: (err) => {
        this.errorMessage = err?.error?.error?.message || 'Delete failed';
      }
    });
  }

  trackByMedication(index: number, medication: any): string {
    return medication._id;
  }

  clearError(): void {
    this.errorMessage = '';
  }

  // --- Added logic below ---

  refreshMedications(): void {
    this.loadMedications();
  }

  clearSearch(): void {
    this.search = '';
    this.page = 1;
    this.loadMedications();
  }

  applyMedicationFilters(): void {
    let data = [...this.medications];

    if (this.stockFilter === 'low') {
      data = data.filter(m => m.stock_quantity <= m.low_stock_threshold);
    }

    if (this.stockFilter === 'healthy') {
      data = data.filter(m => m.stock_quantity > m.low_stock_threshold);
    }

    if (this.expiryFilter === 'expired') {
      data = data.filter(m => this.isExpired(m.expiry_date));
    }

    if (this.expiryFilter === 'valid') {
      data = data.filter(m => !this.isExpired(m.expiry_date));
    }

    if (this.sortField) {
      data.sort((a, b) => {
        let valA = a[this.sortField] ?? '';
        let valB = b[this.sortField] ?? '';

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredMedications = data;
  }

  sortMedications(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.applyMedicationFilters();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'bi-arrow-down-up';
    return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  isExpired(date: string): boolean {
    if (!date) return false;
    return new Date(date) < new Date();
  }

  calculateStats(): void {
    this.lowStockCount = this.medications.filter(m => m.stock_quantity <= m.low_stock_threshold).length;
    this.expiredCount = this.medications.filter(m => this.isExpired(m.expiry_date)).length;
  }

  // Pagination

  goToPreviousPage(): void {
    if (this.page <= 1) return;
    this.page--;
    this.loadMedications();
  }

  goToNextPage(): void {
    if (this.page >= this.totalPages) return;
    this.page++;
    this.loadMedications();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.page = p;
    this.loadMedications();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(this.page - 2, 1);
    const end = Math.min(this.page + 2, this.totalPages);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Modal

  openMedicationModal(m: any): void {
    this.selectedMedication = m;
  }

  closeMedicationModal(): void {
    this.selectedMedication = null;
  }

  // Inline Edit

  startInlineEdit(m: any): void {
    this.editingMedicationId = m._id;
    this.editMedicationData = { ...m };
  }

  cancelInlineEdit(): void {
    this.editingMedicationId = null;
    this.editMedicationData = null;
    this.savingMedicationId = null;
  }

  saveInlineEdit(): void {
    if (!this.editMedicationData || !this.editingMedicationId) return;

    this.savingMedicationId = this.editingMedicationId;

    this.medicationService.updateMedication(this.editingMedicationId, this.editMedicationData).subscribe({
      next: () => {
        this.cancelInlineEdit();
        this.loadMedications();
      },
      error: (err) => {
        this.errorMessage = err?.error?.error?.message || 'Update failed';
        this.savingMedicationId = null;
      }
    });
  }

  // Highlight
  highlightSearchText(value: string): SafeHtml {
    const text = String(value || '');

    if (!this.search.trim()) return text;

    const escaped = this.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const result = text.replace(regex, '<mark class="search-highlight">$1</mark>');

    return this.sanitizer.bypassSecurityTrustHtml(result);
  }

  isPrivileged(): boolean {
    const role = this.currentUser?.role;
    return role === 'admin' || role === 'pharmacist';
  }
}