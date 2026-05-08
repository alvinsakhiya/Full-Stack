import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CycleService } from '../../services/cycle';
import { PatientService } from '../../services/patient';
import { MedicationService } from '../../services/medication';

@Component({
  selector: 'app-cycle-form',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cycle-form.html',
  styleUrl: './cycle-form.css'
})
export class CycleForm implements OnInit {
  private cycleService = inject(CycleService);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private medicationService = inject(MedicationService);
  private cdr = inject(ChangeDetectorRef);
  medications: any[] = [];
  selectedMedications: any[] = [];

  patients: any[] = [];

  form = {
    patient_id: '',
    week_start: '',
    week_end: ''
  };

  errorMessage = '';
  isSubmitting = false;

  ngOnInit(): void {
    this.loadPatients();
    this.loadMedications();
    this.setCurrentWeek();
  }

  loadMedications(): void {
    this.medicationService.getMedications(1, 1000).subscribe({
      next: (res) => {
        this.medications = res.data || [];
        this.cdr.detectChanges();
      }
    });
  }

  addMedication(): void {
    this.selectedMedications.push({
      medication_id: '',
      morning: false,
      afternoon: false,
      evening: false,
      bedtime: false
    });
  }

  removeMedication(index: number): void {
    this.selectedMedications.splice(index, 1);
  }

  setCurrentWeek(): void {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    this.form.week_start = monday.toISOString().split('T')[0];
    this.form.week_end = sunday.toISOString().split('T')[0];
  }

  canSubmit(): boolean {
    if (this.isSubmitting) {
      return false;
    }

    if (!this.form.patient_id || !this.form.week_start || !this.form.week_end) {
      return false;
    }

    return this.selectedMedications.some(item => {
      return item.medication_id && (item.morning || item.afternoon || item.evening || item.bedtime);
    });
  }

  getSelectedWeekLabel(): string {
    if (!this.form.week_start || !this.form.week_end) {
      return 'Select a week';
    }

    const start = new Date(this.form.week_start);
    const end = new Date(this.form.week_end);

    const startText = start.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });

    const endText = end.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return `Week ${startText} – ${endText}`;
  }

  loadPatients(): void {
    this.patientService.getPatients(1, 1000).subscribe({
      next: (res) => {
        this.patients = res.data || [];
        this.cdr.detectChanges();
      }
    });
  }

  createCycle(): void {
    this.errorMessage = '';

    if (!this.form.patient_id) {
      this.errorMessage = 'Please select a patient';
      return;
    }

    if (!this.form.week_start || !this.form.week_end) {
      this.errorMessage = 'Please select week dates';
      return;
    }

    if (this.selectedMedications.length === 0) {
      this.errorMessage = 'Add at least one medication';
      return;
    }

    const hasValidMedication = this.selectedMedications.some(item => {
      return item.medication_id && (item.morning || item.afternoon || item.evening || item.bedtime);
    });

    if (!hasValidMedication) {
      this.errorMessage = 'Select at least one medication and one timing';
      return;
    }

    this.isSubmitting = true;

    const tray_structure: any = {
      monday: { morning: [], afternoon: [], evening: [], bedtime: [] },
      tuesday: { morning: [], afternoon: [], evening: [], bedtime: [] },
      wednesday: { morning: [], afternoon: [], evening: [], bedtime: [] },
      thursday: { morning: [], afternoon: [], evening: [], bedtime: [] },
      friday: { morning: [], afternoon: [], evening: [], bedtime: [] },
      saturday: { morning: [], afternoon: [], evening: [], bedtime: [] },
      sunday: { morning: [], afternoon: [], evening: [], bedtime: [] }
    };

    for (const item of this.selectedMedications) {
      if (!item.medication_id) continue;
      if (!item.morning && !item.afternoon && !item.evening && !item.bedtime) continue;

      for (const day of Object.keys(tray_structure)) {
        if (item.morning) tray_structure[day].morning.push({ medication_id: item.medication_id, quantity: 1 });
        if (item.afternoon) tray_structure[day].afternoon.push({ medication_id: item.medication_id, quantity: 1 });
        if (item.evening) tray_structure[day].evening.push({ medication_id: item.medication_id, quantity: 1 });
        if (item.bedtime) tray_structure[day].bedtime.push({ medication_id: item.medication_id, quantity: 1 });
      }
    }

    const payload = {
      ...this.form,
      status: 'pending',
      tray_structure
    };

    this.cycleService.createCycle(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
        this.router.navigate(['/cycles']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.error?.message || 'Failed to create cycle';
        this.cdr.detectChanges();
      }
    });
  }
}