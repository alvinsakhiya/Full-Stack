import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../services/patient';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-patients',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './patients.html',
  styleUrl: './patients.css'
})
export class Patients implements OnInit {
  private patientService = inject(PatientService);
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  patients: any[] = [];
  filteredPatients: any[] = [];

  search = '';
  allergyFilter: 'all' | 'with' | 'without' = 'all';

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
  selectedPatient: any = null;

  // Inline edit
  editingPatientId: string | null = null;
  editPatientData: any = null;
  savingPatientId: string | null = null;

  currentUser: { role: string | null } = {
    role: null
  };

  ngOnInit(): void {
    this.currentUser.role = this.authService.getRole();
    this.loadPatients();
  }

  loadPatients(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.patientService.getPatients(this.page, this.limit, this.search).subscribe({
      next: (response) => {
        this.patients = response.data || [];
        this.filteredPatients = [...this.patients];
        this.total = response.total || 0;
        this.totalPages = Math.max(Math.ceil(this.total / this.limit), 1);
        this.applyPatientFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error?.message || 'Failed to load patients';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadPatients();
  }

  refreshPatients(): void {
    this.loadPatients();
  }

  clearSearch(): void {
    this.search = '';
    this.page = 1;
    this.loadPatients();
  }

  goToPreviousPage(): void {
    if (this.page <= 1) {
      return;
    }

    this.page -= 1;
    this.loadPatients();
  }

  goToNextPage(): void {
    if (this.page >= this.totalPages) {
      return;
    }

    this.page += 1;
    this.loadPatients();
  }

  goToPage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.totalPages || pageNumber === this.page) {
      return;
    }

    this.page = pageNumber;
    this.loadPatients();
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

  applyPatientFilters(): void {
    let data = [...this.patients];

    if (this.allergyFilter === 'with') {
      data = data.filter(p => p.allergies && p.allergies.length > 0);
    }

    if (this.allergyFilter === 'without') {
      data = data.filter(p => !p.allergies || p.allergies.length === 0);
    }

    if (this.sortField) {
      data.sort((a, b) => {
        let valA = a[this.sortField];
        let valB = b[this.sortField];

        if (Array.isArray(valA)) valA = valA.length;
        if (Array.isArray(valB)) valB = valB.length;

        valA = valA || '';
        valB = valB || '';

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredPatients = data;
  }

  sortPatients(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.applyPatientFilters();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'bi-arrow-down-up';
    return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  openPatientModal(patient: any): void {
    this.selectedPatient = patient;
  }

  closePatientModal(): void {
    this.selectedPatient = null;
  }

  startInlineEdit(patient: any): void {
    this.editingPatientId = patient._id;
    this.editPatientData = {
      ...patient,
      allergiesText: Array.isArray(patient.allergies) ? patient.allergies.join(', ') : ''
    };
  }

  cancelInlineEdit(): void {
    this.editingPatientId = null;
    this.editPatientData = null;
    this.savingPatientId = null;
  }

  saveInlineEdit(): void {
    if (!this.editPatientData || !this.editingPatientId) {
      return;
    }

    this.savingPatientId = this.editingPatientId;

    const payload = {
      name: this.editPatientData.name,
      date_of_birth: this.editPatientData.date_of_birth,
      phone: this.editPatientData.phone,
      notes: this.editPatientData.notes,
      allergies: this.editPatientData.allergiesText
        ? this.editPatientData.allergiesText.split(',').map((item: string) => item.trim()).filter(Boolean)
        : []
    };

    this.patientService.updatePatient(this.editingPatientId, payload).subscribe({
      next: () => {
        this.cancelInlineEdit();
        this.loadPatients();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error?.message || 'Failed to update patient';
        this.savingPatientId = null;
      }
    });
  }

  highlightSearchText(value: string | null | undefined): SafeHtml {
    const text = String(value || '');

    if (!this.search.trim()) {
      return text;
    }

    const escapedSearch = this.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearch})`, 'gi');
    const highlighted = text.replace(regex, '<mark class="search-highlight">$1</mark>');

    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  deletePatient(id: string): void {
    if (this.editingPatientId === id) {
      this.cancelInlineEdit();
    }
    if (!confirm('Are you sure you want to delete this patient?')) {
      return;
    }

    this.patientService.deletePatient(id).subscribe({
      next: () => {
        this.loadPatients();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error?.message || 'Failed to delete patient';
      }
    });
  }
  trackByPatient(index: number, patient: any): string {
    return patient._id;
  }

  isPrivileged(): boolean {
    const role = this.currentUser?.role;
    return role === 'admin' || role === 'pharmacist';
  }

  clearError(): void {
    this.errorMessage = '';
  }
}