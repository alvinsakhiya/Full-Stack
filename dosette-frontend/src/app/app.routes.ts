import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Patients } from './pages/patients/patients';
import { PatientForm } from './pages/patient-form/patient-form';
import { Medications } from './pages/medications/medications';
import { MedicationForm } from './pages/medication-form/medication-form';
import { Cycles } from './pages/cycles/cycles';
import { CycleForm } from './pages/cycle-form/cycle-form';
import { PickingLists } from './pages/picking-lists/picking-lists';
import { Reports } from './pages/reports/reports';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: Login },
  { path: 'register', component: Register },

  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    data: { roles: ['admin', 'pharmacist', 'dispenser'] }
  },

  {
    path: 'patients',
    component: Patients,
    canActivate: [authGuard],
    data: { roles: ['admin', 'pharmacist'] }
  },
  {
    path: 'patients/new',
    component: PatientForm,
    canActivate: [authGuard],
    data: { roles: ['admin', 'pharmacist'] }
  },
  {
    path: 'patients/edit/:id',
    component: PatientForm,
    canActivate: [authGuard],
    data: { roles: ['admin', 'pharmacist'] }
  },

  {
    path: 'medications',
    component: Medications,
    canActivate: [authGuard],
    data: { roles: ['admin', 'pharmacist'] }
  },
  {
    path: 'medications/new',
    component: MedicationForm,
    canActivate: [authGuard],
    data: { roles: ['admin', 'pharmacist'] }
  },
  {
    path: 'medications/edit/:id',
    component: MedicationForm,
    canActivate: [authGuard],
    data: { roles: ['admin', 'pharmacist'] }
  },

  {
    path: 'cycles',
    component: Cycles,
    canActivate: [authGuard],
    data: { roles: ['admin', 'pharmacist'] }
  },
  {
    path: 'cycles/new',
    component: CycleForm,
    canActivate: [authGuard],
    data: { roles: ['admin', 'pharmacist'] }
  },

  {
    path: 'picking-lists',
    component: PickingLists,
    canActivate: [authGuard],
    data: { roles: ['admin', 'pharmacist', 'dispenser'] }
  },

  {
    path: 'reports',
    component: Reports,
    canActivate: [authGuard],
    data: { roles: ['admin', 'pharmacist'] }
  },

  { path: '**', redirectTo: 'login' }
];