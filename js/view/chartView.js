let weeklyHoursChart;

export function renderWeeklyHoursChart(weeks) {
  const canvas = document.querySelector('[data-weekly-hours-chart]');
  if (!canvas) return;
  if (typeof window.Chart !== 'function') {
    throw new Error('The chart library could not be loaded. Check your internet connection and reload the dashboard.');
  }

  const data = {
    labels: weeks.map((week) => week.label),
    datasets: [{
      data: weeks.map((week) => Number(week.hours.toFixed(2))),
      backgroundColor: '#7C3AED',
      hoverBackgroundColor: '#6D28D9',
      borderRadius: 5,
      borderSkipped: false,
      maxBarThickness: 38,
    }],
  };

  if (weeklyHoursChart) {
    weeklyHoursChart.data = data;
    weeklyHoursChart.update();
    return;
  }

  weeklyHoursChart = new window.Chart(canvas, {
    type: 'bar',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: { label: (context) => `${context.parsed.y} ${context.parsed.y === 1 ? 'hour' : 'hours'}` },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#85877f', font: { family: 'DM Sans', size: 10 }, maxRotation: 0, autoSkip: false },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f0f0eb', drawTicks: false },
          border: { display: false, dash: [3, 3] },
          ticks: { color: '#999a93', font: { family: 'DM Sans', size: 10 }, padding: 8, precision: 0 },
        },
      },
    },
  });
}
