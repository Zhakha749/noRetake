import { Component, Input, OnChanges, OnInit, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Subscription } from 'rxjs';
import { AverageRatings } from '../../../core/models';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-radar-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="radar-wrap" [style.width]="size" [style.height]="size">
      <canvas baseChart
        [data]="chartData"
        [options]="chartOptions"
        type="radar">
      </canvas>
    </div>
  `,
  styles: [`.radar-wrap { position:relative; }`],
})
export class RadarChartComponent implements OnChanges, OnInit, OnDestroy {
  @Input() ratings!: AverageRatings;
  @Input() size = '300px';
  @Input() compareRatings?: AverageRatings;
  @Input() compareLabel = 'Compared';
  @Input() primaryLabel = 'This teacher';
  /** Если true — текст всегда белый (компонент внутри тёмного попапа). */
  @Input() forceDark = false;

  private readonly theme = inject(ThemeService);
  private sub?: Subscription;
  private isDark = true;

  chartData: ChartData<'radar'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'radar'> = {};

  ngOnInit(): void {
    this.isDark = this.forceDark || this.theme.isDark;
    this.applyOptions();

    this.sub = this.theme.isDark$.subscribe(dark => {
      this.isDark = this.forceDark || dark;
      this.applyOptions();
      this.buildChart();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ratings'] || changes['compareRatings']) {
      this.buildChart();
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private applyOptions(): void {
    const textColor   = this.isDark ? '#ffffff' : '#111111';
    const mutedColor  = this.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
    const gridColor   = this.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          min: 0,
          max: 10,
          ticks: {
            stepSize: 2,
            font: { size: 10 },
            color: mutedColor,
            backdropColor: 'transparent',
          },
          pointLabels: {
            font: { size: 12, weight: 'bold' },
            color: textColor,
          },
          grid:       { color: gridColor },
          angleLines: { color: gridColor },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, color: textColor },
        },
      },
    };
  }

  private buildChart(): void {
    if (!this.ratings) return;
    const labels  = ['Clarity', 'Objectivity', 'Accessibility', 'Workload'];
    const primary = [
      this.ratings.clarity,
      this.ratings.objectivity,
      this.ratings.accessibility,
      this.ratings.workload,
    ];

    const datasets: ChartData<'radar'>['datasets'] = [
      {
        label: this.primaryLabel,
        data: primary,
        backgroundColor: 'rgba(57,73,171,0.2)',
        borderColor: 'rgba(57,73,171,0.9)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(57,73,171,1)',
        pointRadius: 4,
      },
    ];

    if (this.compareRatings) {
      datasets.push({
        label: this.compareLabel,
        data: [
          this.compareRatings.clarity,
          this.compareRatings.objectivity,
          this.compareRatings.accessibility,
          this.compareRatings.workload,
        ],
        backgroundColor: 'rgba(245,124,0,0.2)',
        borderColor: 'rgba(245,124,0,0.9)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(245,124,0,1)',
        pointRadius: 4,
      });
    }

    this.chartData = { labels, datasets };
  }
}
