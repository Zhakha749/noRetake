import { Component, Input, OnChanges } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { GradeDistribution } from '../../../core/models';

const GRADE_LABELS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'FX'];

// Colour per grade bucket: green → yellow → red
const GRADE_COLOURS = [
  '#2e7d32','#43a047','#66bb6a','#8bc34a','#aed581',
  '#ffca28','#ffa726','#ff7043','#e53935','#c62828','#880e4f','#4a148c',
];

@Component({
  selector: 'app-grade-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="chart-wrap">
      <canvas baseChart
        [data]="chartData"
        [options]="chartOptions"
        type="bar">
      </canvas>
    </div>
  `,
  styles: [`.chart-wrap { position:relative; height:260px; }`],
})
export class GradeChartComponent implements OnChanges {
  @Input() distribution!: GradeDistribution;
  @Input() label = 'Students';

  chartData: ChartData<'bar'> = { labels: GRADE_LABELS, datasets: [] };

  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.parsed.y} student${ctx.parsed.y !== 1 ? 's' : ''}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        title: { display: true, text: 'Students' },
      },
    },
  };

  ngOnChanges(): void {
    if (!this.distribution) return;
    const values = GRADE_LABELS.map(g => (this.distribution as unknown as Record<string, number>)[g] ?? 0);
    this.chartData = {
      labels: GRADE_LABELS,
      datasets: [{
        label: this.label,
        data: values,
        backgroundColor: GRADE_COLOURS,
        borderRadius: 4,
        borderSkipped: false,
      }],
    };
  }
}
