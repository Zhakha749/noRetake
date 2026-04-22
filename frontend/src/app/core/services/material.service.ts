import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StudyMaterial, PaginatedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class MaterialService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/materials`;

  getApproved(subjectId: number): Observable<PaginatedResponse<StudyMaterial>> {
    return this.http.get<PaginatedResponse<StudyMaterial>>(`${this.base}/`, {
      params: { subject: subjectId.toString() },
    });
  }

  submit(formData: FormData): Observable<StudyMaterial> {
    return this.http.post<StudyMaterial>(`${this.base}/`, formData);
  }
}
