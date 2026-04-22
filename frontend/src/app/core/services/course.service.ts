import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CourseInstance } from '../models';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/course-instances`;

  getById(id: number): Observable<CourseInstance> {
    return this.http.get<CourseInstance>(`${this.base}/${id}/`);
  }

  compare(ids: number[]): Observable<CourseInstance[]> {
    return this.http.get<CourseInstance[]>(`${this.base}/compare/`, {
      params: { ids: ids.join(',') },
    });
  }
}
