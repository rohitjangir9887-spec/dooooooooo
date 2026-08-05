import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import { formatPeso } from "../utils/formatters.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip);

const GOLD = "#C9A84C";

const tooltipStyle = {
  backgroundColor: "#242424",
  borderColor: "#333333",
  borderWidth: 1,
  titleColor: "#F5F5F0",
  bodyColor: "#C9A84C",
  displayColors: false,
  padding: 12
};

export function lineData(points) {
  return {
    labels: points.map((p) => p.day),
    datasets: [{
      data: points.map((p) => p.amount),
      borderColor: GOLD,
      pointBackgroundColor: "#242424",
      pointBorderColor: GOLD,
      pointRadius: 4,
      tension: 0.36,
      fill: true,
      backgroundColor: (context) => {
        const { ctx, chartArea } = context.chart;
        if (!chartArea) return "rgba(201,168,76,0.2)";
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, "rgba(201,168,76,0.22)");
        gradient.addColorStop(1, "rgba(201,168,76,0)");
        return gradient;
      }
    }]
  };
}

export const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { ...tooltipStyle, callbacks: { label: (ctx) => formatPeso(ctx.parsed.y) } } },
  scales: { x: { grid: { display: false }, ticks: { color: "#8A8A82" }, border: { display: false } }, y: { display: false, grid: { display: false } } }
};

export function barData(points, byBarber, barbers = []) {
  if (byBarber && barbers.length) {
    return {
      labels: points.map((p) => p.date),
      datasets: barbers.slice(0, 3).map((barber, i) => ({
        label: barber.name,
        data: points.map((p) => Math.round(p.amount * [0.42, 0.35, 0.23][i])),
        backgroundColor: barber.color,
        borderRadius: 3
      }))
    };
  }
  return {
    labels: points.map((p) => p.date),
    datasets: [{ data: points.map((p) => p.amount), backgroundColor: GOLD, borderRadius: 3 }]
  };
}

export const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { ...tooltipStyle, callbacks: { label: (ctx) => `${ctx.dataset.label ? `${ctx.dataset.label}: ` : ""}${formatPeso(ctx.parsed.y)}` } } },
  scales: { x: { stacked: true, grid: { display: false }, ticks: { color: "#8A8A82", maxTicksLimit: 4 }, border: { display: false } }, y: { stacked: true, display: false, grid: { display: false } } }
};
