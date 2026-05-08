import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PatientService } from '../../services/patient';

@Component({
  selector: 'app-patient-form',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './patient-form.html',
  styleUrl: './patient-form.css'
})
export class PatientForm implements OnInit {
  private patientService = inject(PatientService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  patientId: string | null = null;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  patient = {
    name: '',
    date_of_birth: '',
    phone: '',
    allergies: '',
    notes: ''
  };

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.patientId;

    if (this.patientId) {
      this.loadPatient(this.patientId);
    }
  }

  loadPatient(id: string): void {
    this.isLoading = true;

    this.patientService.getPatient(id).subscribe({
      next: (response) => {
        const data = response.data;

        this.patient = {
          name: data.name || '',
          date_of_birth: data.date_of_birth || '',
          phone: data.phone || '',
          allergies: Array.isArray(data.allergies) ? data.allergies.join(', ') : '',
          notes: data.notes || ''
        };

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error?.message || 'Failed to load patient';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  savePatient(): void {
    this.errorMessage = '';

    if (!this.patient.name.trim() || !this.patient.date_of_birth) {
      this.errorMessage = 'Name and Date of Birth are required';
      return;
    }

    this.isSaving = true;

    const payload = {
      name: this.patient.name,
      date_of_birth: this.patient.date_of_birth,
      phone: this.patient.phone,
      allergies: this.patient.allergies
        ? this.patient.allergies
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0)
        : [],
      notes: this.patient.notes
    };

    const request = this.isEditMode && this.patientId
      ? this.patientService.updatePatient(this.patientId, payload)
      : this.patientService.createPatient(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.cdr.detectChanges();
        this.router.navigate(['/patients']);
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error?.error?.error?.message || 'Failed to save patient';
        this.cdr.detectChanges();
      }
    });
  }
}