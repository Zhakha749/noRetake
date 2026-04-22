import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Review, ReviewCreatePayload } from '../models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/reviews`;

  create(payload: ReviewCreatePayload): Observable<Review> {
    return this.http.post<Review>(`${this.base}/`, payload);
  }

  vote(id: number, vote: 'up' | 'down'): Observable<{ helpful_votes: number }> {
    return this.http.post<{ helpful_votes: number }>(`${this.base}/${id}/vote/`, { vote });
  }

  report(id: number, reason: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/report/`, { reason });
  }
}
