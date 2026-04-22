import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminStats, AdminReport, StudyMaterial, PaginatedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/stats/`);
  }

  getPendingMaterials(): Observable<PaginatedResponse<StudyMaterial>> {
    return this.http.get<PaginatedResponse<StudyMaterial>>(`${this.base}/moderation/materials/`);
  }

  approveMaterial(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/moderation/materials/${id}/`, { action: 'approve' });
  }

  rejectMaterial(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/moderation/materials/${id}/`, { action: 'reject' });
  }

  getOpenReports(): Observable<PaginatedResponse<AdminReport>> {
    return this.http.get<PaginatedResponse<AdminReport>>(`${this.base}/moderation/reports/`);
  }

  resolveReport(id: number, action: 'hide_review' | 'dismiss' | 'ban_user'): Observable<void> {
    return this.http.post<void>(`${this.base}/moderation/reports/${id}/`, { action });
  }

  massSyllabus(formData: FormData): Observable<{ message: string; syllabus_id: number }> {
    return this.http.post<{ message: string; syllabus_id: number }>(
      `${this.base}/mass-assign-syllabus/`, formData
    );
  }
}
