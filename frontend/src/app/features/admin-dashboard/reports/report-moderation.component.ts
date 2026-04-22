import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { AdminService } from '../../../core/services/admin.service';
import { AdminReport } from '../../../core/models';

@Component({
  selector: 'app-report-moderation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule, MatMenuModule,
  ],
  template: `
    <div class="rmod">
      <h1 class="rmod__title">Report Moderation</h1>

      @if (loading()) {
        <div class="rmod__spinner">
          <mat-spinner diameter="48" />
        </div>
      } @else if (reports().length === 0) {
        <div class="rmod__empty">
          <mat-icon>shield</mat-icon>
          <p>No open reports — all clear!</p>
        </div>
      } @else {
        <table mat-table [dataSource]="reports()" class="rmod__table">

          <!-- Review excerpt -->
          <ng-container matColumnDef="review_text">
            <th mat-header-cell *matHeaderCellDef>Review excerpt</th>
            <td mat-cell *matCellDef="let row">
              <span class="rmod__excerpt">{{ row.review_text | slice:0:120 }}{{ row.review_text.length > 120 ? '…' : '' }}</span>
            </td>
          </ng-container>

          <!-- Reporter -->
          <ng-container matColumnDef="reporter_name">
            <th mat-header-cell *matHeaderCellDef>Reporter</th>
            <td mat-cell *matCellDef="let row">{{ row.reporter_name }}</td>
          </ng-container>

          <!-- Reason -->
          <ng-container matColumnDef="reason">
            <th mat-header-cell *matHeaderCellDef>Reason</th>
            <td mat-cell *matCellDef="let row">
              <span class="rmod__reason text-muted">{{ row.reason | slice:0:80 }}{{ row.reason.length > 80 ? '…' : '' }}</span>
            </td>
          </ng-container>

          <!-- Date -->
          <ng-container matColumnDef="created_at">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let row" class="text-muted">{{ row.created_at | date:'mediumDate' }}</td>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button [matMenuTriggerFor]="actionMenu" matTooltip="Actions">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #actionMenu="matMenu">
                <button mat-menu-item (click)="resolve(row, 'hide_review')">
                  <mat-icon color="warn">visibility_off</mat-icon>
                  Hide review
                </button>
                <button mat-menu-item (click)="resolve(row, 'dismiss')">
                  <mat-icon>close</mat-icon>
                  Dismiss report
                </button>
                <button mat-menu-item (click)="resolve(row, 'ban_user')">
                  <mat-icon color="warn">person_off</mat-icon>
                  Ban user
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
        </table>

        <p class="text-muted rmod__count">{{ reports().length }} open report(s)</p>
      }
    </div>
  `,
  styles: [`
    .rmod { max-width: 960px; }
    .rmod__title { font-size: 1.5rem; font-weight: 800; margin: 0 0 24px; }
    .rmod__spinner { display: flex; justify-content: center; padding: 60px 0; }
    .rmod__empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 60px 0; color: var(--color-text-muted);
      mat-icon { font-size: 48px; height: 48px; width: 48px; color: var(--color-success); }
    }
    .rmod__table { width: 100%; background: var(--color-surface); }
    .rmod__excerpt { font-size: .85rem; font-style: italic; }
    .rmod__reason  { font-size: .82rem; }
    .rmod__count   { margin-top: 12px; }
  `],
})
export class ReportModerationComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly snack    = inject(MatSnackBar);
  private readonly cdr      = inject(ChangeDetectorRef);

  readonly cols = ['review_text', 'reporter_name', 'reason', 'created_at', 'actions'];

  loading = signal(true);
  reports = signal<AdminReport[]>([]);

  ngOnInit(): void {
    this.adminSvc.getOpenReports().subscribe({
      next: r => {
        this.reports.set(r.results);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => this.loading.set(false),
    });
  }

  resolve(report: AdminReport, action: 'hide_review' | 'dismiss' | 'ban_user'): void {
    this.adminSvc.resolveReport(report.id, action).subscribe({
      next: () => {
        this.reports.update(list => list.filter(r => r.id !== report.id));
        const msg = action === 'hide_review' ? 'Review hidden.'
                  : action === 'dismiss'     ? 'Report dismissed.'
                  : 'User banned.';
        this.snack.open(msg, 'Close', { duration: 3000 });
        this.cdr.markForCheck();
      },
      error: () => this.snack.open('Action failed.', 'Close', { duration: 3000, panelClass: ['error-snack'] }),
    });
  }
}
