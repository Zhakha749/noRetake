import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Subject, PaginatedResponse } from '../models';

export interface SubjectFilterParams {
  search?: string;
  category?: string;
  ordering?: string;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class SubjectService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/subjects`;

  getAll(filters: SubjectFilterParams = {}): Observable<PaginatedResponse<Subject>> {
    let params = new HttpParams();
    if (filters.search)   params = params.set('search', filters.search);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.ordering) params = params.set('ordering', filters.ordering);
    if (filters.page)     params = params.set('page', filters.page.toString());
    return this.http.get<PaginatedResponse<Subject>>(`${this.base}/`, { params });
  }

  getById(id: number): Observable<Subject> {
    return this.http.get<Subject>(`${this.base}/${id}/`);
  }

  getDifficultyStats(id: number): Observable<Pick<Subject, 'overall_difficulty' | 'teacher_dependency_ratio'>> {
    return this.http.get<Pick<Subject, 'overall_difficulty' | 'teacher_dependency_ratio'>>(`${this.base}/${id}/`);
  }
}
