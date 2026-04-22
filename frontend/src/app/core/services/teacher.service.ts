import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Teacher, PaginatedResponse } from '../models';

export interface TeacherFilterParams {
  search?: string;
  age_range?: string;
  subject?: number;
  ordering?: string;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/teachers`;

  getAll(filters: TeacherFilterParams = {}): Observable<PaginatedResponse<Teacher>> {
    let params = new HttpParams();
    if (filters.search)    params = params.set('search', filters.search);
    if (filters.age_range) params = params.set('age_range', filters.age_range);
    if (filters.subject)   params = params.set('subject', filters.subject.toString());
    if (filters.ordering)  params = params.set('ordering', filters.ordering);
    if (filters.page)      params = params.set('page', filters.page.toString());
    return this.http.get<PaginatedResponse<Teacher>>(`${this.base}/`, { params });
  }

  getById(id: number): Observable<Teacher> {
    return this.http.get<Teacher>(`${this.base}/${id}/`);
  }

  getAverageRatings(id: number): Observable<Teacher['average_ratings']> {
    return this.http.get<Teacher['average_ratings']>(`${this.base}/${id}/`);
  }
}
