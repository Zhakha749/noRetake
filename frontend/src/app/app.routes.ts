import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'teachers',
    loadComponent: () => import('./features/teachers/teacher-list/teacher-list.component')
      .then(m => m.TeacherListComponent),
  },
  {
    path: 'teachers/:id',
    loadComponent: () => import('./features/teachers/teacher-profile/teacher-profile.component')
      .then(m => m.TeacherProfileComponent),
  },
  {
    path: 'subjects',
    loadComponent: () => import('./features/subjects/subject-list/subject-list.component')
      .then(m => m.SubjectListComponent),
  },
  {
    path: 'subjects/:id',
    loadComponent: () => import('./features/subjects/subject-detail/subject-detail.component')
      .then(m => m.SubjectDetailComponent),
  },
  {
    path: 'course/:id',
    loadComponent: () => import('./features/course-detail/course-detail.component')
      .then(m => m.CourseDetailComponent),
  },
  {
    path: 'compare',
    loadComponent: () => import('./features/compare/compare.component')
      .then(m => m.CompareComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component')
      .then(m => m.RegisterComponent),
  },
  {
    path: 'admin-dashboard',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin-dashboard/admin-dashboard.component')
      .then(m => m.AdminDashboardComponent),
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./features/admin-dashboard/overview/admin-overview.component')
          .then(m => m.AdminOverviewComponent),
      },
      {
        path: 'materials',
        loadComponent: () => import('./features/admin-dashboard/materials/material-moderation.component')
          .then(m => m.MaterialModerationComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/admin-dashboard/reports/report-moderation.component')
          .then(m => m.ReportModerationComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
