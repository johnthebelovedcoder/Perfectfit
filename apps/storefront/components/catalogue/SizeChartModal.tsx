"use client";

import { useState } from "react";
import { X, Ruler } from "lucide-react";

const CHARTS = {
  TOPS: {
    label: "Tops & Outerwear",
    headers: ["Size", "US Size", "Chest (in)", "Waist (in)", "Hip (in)"],
    rows: [
      ["XS", "0–2", "32–33", "25–26", "35–36"],
      ["S",  "4–6", "34–35", "27–28", "37–38"],
      ["M",  "8–10","36–37", "29–30", "39–40"],
      ["L",  "12–14","38–40","31–33", "41–43"],
      ["XL", "16–18","41–43","34–36", "44–46"],
      ["2XL","20–22","44–46","37–39", "47–49"],
    ],
  },
  BOTTOMS: {
    label: "Bottoms & Dresses",
    headers: ["Size", "US Size", "Waist (in)", "Hip (in)", "Inseam (in)"],
    rows: [
      ["XS / 24", "0",   "24–25", "34–35", "30"],
      ["S  / 26", "2–4", "26–27", "36–37", "30"],
      ["M  / 28", "6–8", "28–30", "38–40", "30"],
      ["L  / 30", "10–12","31–33","41–43","30"],
      ["XL / 32", "14–16","34–36","44–46","30"],
      ["2XL/ 34", "18–20","37–39","47–49","30"],
    ],
  },
  SHOES: {
    label: "Footwear",
    headers: ["US Women", "US Men", "EU", "UK", "Foot Length (in)"],
    rows: [
      ["5",  "3.5", "35–36", "2.5", "8.5"],
      ["6",  "4.5", "36–37", "3.5", "9.0"],
      ["7",  "5.5", "37–38", "4.5", "9.4"],
      ["8",  "6.5", "38–39", "5.5", "9.75"],
      ["9",  "7.5", "39–40", "6.5", "10.1"],
      ["10", "8.5", "40–41", "7.5", "10.5"],
      ["11", "9.5", "42–43", "8.5", "11.0"],
      ["12", "10.5","43–44", "9.5", "11.4"],
    ],
  },
};

type CategoryKey = keyof typeof CHARTS;

interface Props {
  category?: string;
}

export function SizeChartModal({ category }: Props) {
  const [open, setOpen] = useState(false);

  // Default to the most relevant generic garment chart for the item's category.
  const defaultKey: CategoryKey =
    category === "SHOES_BAGS" ? "SHOES" :
    (category === "SKIRTS_BLOUSES" || category === "DRESSES_GOWNS") ? "BOTTOMS" :
    "TOPS";

  const [activeChart, setActiveChart] = useState<CategoryKey>(defaultKey);
  const chart = CHARTS[activeChart];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        <Ruler className="h-3.5 w-3.5" />
        Size Chart
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Ruler className="h-5 w-5 text-gray-500" />
                <h2 className="text-base font-bold text-gray-900">Size Chart</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close size chart"
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 p-4 pb-0">
              {(Object.keys(CHARTS) as CategoryKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveChart(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    activeChart === key
                      ? "bg-gray-900 text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {CHARTS[key].label}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    {chart.headers.map((h) => (
                      <th key={h} className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chart.rows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      {row.map((cell, j) => (
                        <td key={j} className={`py-2.5 px-3 whitespace-nowrap ${j === 0 ? "font-bold text-gray-900" : "text-gray-600"}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tip */}
            <div className="px-4 pb-5">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
                <strong>How to measure:</strong> For chest/bust, measure around the fullest part of your chest. For waist, measure around your natural waist. For hips, measure around the fullest part of your hips. When in doubt, size up.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
