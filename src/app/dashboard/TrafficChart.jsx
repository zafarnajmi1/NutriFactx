"use client";

import { useState } from "react";

const emptyChart = {
  "7d": { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], values: [0, 0, 0, 0, 0, 0, 0] },
  "30d": { labels: ["—"], values: [0] },
  "90d": { labels: ["—"], values: [0] },
};

export default function TrafficChart({ data }) {
  const chartData = data && typeof data === "object" ? { ...emptyChart, ...data } : emptyChart;
  const [range, setRange] = useState("30d");
  const { labels, values } = chartData[range] || emptyChart[range];
  const safeValues = values?.length ? values : [0];
  const safeLabels = labels?.length ? labels : ["—"];
  const max = Math.max(...safeValues, 1);
  const min = Math.min(...safeValues, 0);
  const width = 560;
  const height = 200;
  const padX = 36;
  const padY = 20;

  const points = safeValues.map((value, index) => {
    const x = padX + (index * (width - padX * 2)) / (safeValues.length - 1 || 1);
    const y =
      padY +
      ((max - value) / (max - min || 1)) * (height - padY * 2);
    return { x, y, value, label: safeLabels[index] || "" };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;

  return (
    <>
      <div className="db-panel-head">
        <h2>Reader traffic</h2>
        <div className="db-chart-tabs">
          {["7d", "30d", "90d"].map((item) => (
            <button
              key={item}
              type="button"
              className={`db-chart-tab${range === item ? " active" : ""}`}
              onClick={() => setRange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="db-chart-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" role="img" aria-label="Reader traffic chart">
          <defs>
            <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(76,122,84,0.25)" />
              <stop offset="100%" stopColor="rgba(76,122,84,0.02)" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((line) => {
            const y = padY + (line * (height - padY * 2)) / 3;
            return (
              <line
                key={line}
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke="#EFEEE7"
                strokeWidth="1"
              />
            );
          })}
          <path d={areaPath} fill="url(#trafficFill)" />
          <path d={linePath} fill="none" stroke="#4C7A54" strokeWidth="2.5" />
          {points.map((point, index) => (
            <text
              key={`${point.label}-${index}`}
              x={point.x}
              y={height - 4}
              textAnchor="middle"
              fill="#94A099"
              fontSize="11"
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>
    </>
  );
}
