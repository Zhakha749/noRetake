import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { AdminService } from '../../../core/services/admin.service';
import { AdminStats } from '../../../core/models';

interface StatCard {
  icon: string;
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, BaseChartDirective],
  template: `
    <div class="overview">
      <h1 class="overview__title">Dashboard Overview</h1>

      @if (loading()) {
        <div class="overview__spinner">
          <mat-spinner diameter="48" />
        </div>
      } @else if (stats()) {
        <!-- Stat cards -->
        <div class="overview__cards">
          @for (card of statCards(); track card.label) {
            <div class="stat-card card">
              <div class="stat-card__icon" [style.background]="card.color + '22'" [style.color]="card.color">
                <mat-icon>{{ card.icon }}</mat-icon>
              </div>
              <div class="stat-card__body">
                <span class="stat-card__value">{{ card.value | number }}</span>
                <span class="stat-card__label text-muted">{{ card.label }}</span>
              </div>
            </div>
          }
        </div>

        <!-- 7-day chart -->
        <div class="card overview__chart-card">
          <h2 class="overview__chart-title">Reviews — last 7 days</h2>
          <div class="overview__chart-wrap">
            <canvas baseChart
              [data]="chartData"
              [options]="chartOptions"
              type="line">
            </canvas>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .overview {
      max-width: 900px;
    }
    .overview__title {
      font-size: 1.5rem; font-weight: 800; margin: 0 0 24px;
    }
    .overview__spinner {
      display: flex; justify-content: center; padding: 60px 0;
    }
    .overview__cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .stat-card {
      display: flex; align-items: center; gap: 14px; padding: 18px;
    }
    .stat-card__icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 22px; }
    }
    .stat-card__body {
      display: flex; flex-direction: column; gap: 2px;
    }
    .stat-card__value { font-size: 1.5rem; font-weight: 800; line-height: 1; }
    .stat-card__label { font-size: .78rem; }
    .overview__chart-card { padding: 20px; }
    .overview__chart-title { font-size: 1rem; font-weight: 700; margin: 0 0 16px; }
    .overview__chart-wrap { height: 220px; position: relative; }
  `],
})
export class AdminOverviewComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly cdr      = inject(ChangeDetectorRef);

  loading = signal(true);
  stats   = signal<AdminStats | null>(null);

  statCards = signal<StatCard[]>([]);

  chartData: ChartData<'line'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  ngOnInit(): void {
    this.adminSvc.getStats().subscribe({
      next: s => {
        this.stats.set(s);
        this.statCards.set([
          { icon: 'people',           label: 'Teachers',          value: s.total_teachers,    color: '#3949ab' },
          { icon: 'menu_book',        label: 'Subjects',          value: s.total_subjects,    color: '#00897b' },
          { icon: 'rate_review',      label: 'Reviews',           value: s.total_reviews,     color: '#f57c00' },
          { icon: 'group',            label: 'Users',             value: s.total_users,       color: '#8e24aa' },
          { icon: 'today',            label: 'Reviews today',     value: s.new_reviews_today, color: '#43a047' },
          { icon: 'pending_actions',  label: 'Pending materials', value: s.pending_materials, color: '#fb8c00' },
          { icon: 'flag',             label: 'Open reports',      value: s.open_reports,      color: '#e53935' },
        ]);

        const days  = s.reviews_last_7_days ?? [];
        this.chartData = {
          labels:   days.map(d => d.date),
          datasets: [{
            label: 'Reviews',
            data:  days.map(d => d.count),
            fill: true,
            tension: 0.4,
            borderColor: '#3949ab',
            backgroundColor: 'rgba(57,73,171,0.12)',
            pointBackgroundColor: '#3949ab',
            pointRadius: 4,
          }],
        };
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => this.loading.set(false),
    });
  }
}
