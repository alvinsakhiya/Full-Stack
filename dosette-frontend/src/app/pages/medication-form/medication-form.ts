import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MedicationService } from '../../services/medication';

@Component({
  selector: 'app-medication-form',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './medication-form.html',
  styleUrl: './medication-form.css'
})
export class MedicationForm implements OnInit {
  private medicationService = inject(MedicationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  medicationId: string | null = null;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  medication = {
    name: '',
    strength: '',
    form: '',
    batch_number: '',
    stock_quantity: 0,
    expiry_date: '',
    price_per_unit: 0,
    low_stock_threshold: 0
  };

  ngOnInit(): void {
    this.medicationId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.medicationId;

    if (this.medicationId) {
      this.loadMedication(this.medicationId);
    }
  }

  loadMedication(id: string): void {
    this.isLoading = true;

    this.medicationService.getMedication(id).subscribe({
      next: (response) => {
        const data = response.data;

        this.medication = {
          name: data.name || '',
          strength: data.strength || '',
          form: data.form || '',
          batch_number: data.batch_number || '',
          stock_quantity: data.stock_quantity || 0,
          expiry_date: data.expiry_date || '',
          price_per_unit: data.price_per_unit || 0,
          low_stock_threshold: data.low_stock_threshold || 0
        };

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error?.message || 'Failed to load medication';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  saveMedication(): void {
    this.errorMessage = '';

    if (!this.medication.name.trim() || !this.medication.strength.trim() || !this.medication.form) {
      this.errorMessage = 'Name, Strength and Form are required';
      return;
    }

    this.isSaving = true;

    const payload = {
      name: this.medication.name,
      strength: this.medication.strength,
      form: this.medication.form,
      batch_number: this.medication.batch_number,
      stock_quantity: Number(this.medication.stock_quantity),
      expiry_date: this.medication.expiry_date,
      price_per_unit: Number(this.medication.price_per_unit),
      low_stock_threshold: Number(this.medication.low_stock_threshold)
    };

    const request = this.isEditMode && this.medicationId
      ? this.medicationService.updateMedication(this.medicationId, payload)
      : this.medicationService.createMedication(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.cdr.detectChanges();
        this.router.navigate(['/medications']);
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error?.error?.error?.message || 'Failed to save medication';
        this.cdr.detectChanges();
      }
    });
  }
}