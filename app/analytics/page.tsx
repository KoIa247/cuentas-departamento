"use client";

import { useCallback, useEffect, useState } from "react";
import { formatAmount } from "@/lib/currencies";
import { getMonthName, MONTH_NAMES } from "@/lib/utils";

interface CategoryTotal {
  name: string;
  color: string;
  icon: string;
  total: number;
  currency: string;
  count: number;
}

interface AnalyticsData {
  categoryTotals: CategoryTotal[];
  totalsByCurrency: Record<string, number>;
  earningsByCurrency: Record<string, number>;
  paymentCount: number;
  earningCount: number;
}

export default function AnalyticsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?month=${month}&year=${year}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateMonth = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  };

  // For the bar chart, find the max total per currency
  const getBarWidth = (total: number, currency: string, allTotals: CategoryTotal[]): number => {
    const maxForCurrency = Math.max(
      ...allTotals.filter((t) => t.currency === currency).map((t) => t.total)
    );
    return maxForCurrency > 0 ? (total / maxForCurrency) * 100 : 0;
  };

  // Group categoryTotals by currency
  const byCurrency = (data?.categoryTotals ?? []).reduce((acc, ct) => {
    if (!acc[ct.currency]) acc[ct.currency] = [];
    acc[ct.currency].push(ct);
    return acc;
  }, {} as Record<string, CategoryTotal[]>);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-slate-500 mt-1">Spending summary by month and category</p>
        </div>

        {/* Month + Year selector */}
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-1 py-1">
            <button
              onClick={() => navigateMonth(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
            >
              ‹
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-slate-400">Failed to load analytics.</div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Spent */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="text-sm font-medium text-slate-500 mb-2">Total Spent</div>
              {Object.entries(data.totalsByCurrency).length === 0 ? (
                <div className="text-2xl font-bold text-slate-300">—</div>
              ) : (
                Object.entries(data.totalsByCurrency).map(([currency, total]) => (
                  <div key={currency} className="text-2xl font-bold text-red-600">
                    {formatAmount(total, currency)}
                  </div>
                ))
              )}
              <div className="text-xs text-slate-400 mt-1">{data.paymentCount} payments</div>
            </div>

            {/* Earned */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="text-sm font-medium text-slate-500 mb-2">Total Earned</div>
              {Object.entries(data.earningsByCurrency).length === 0 ? (
                <div className="text-2xl font-bold text-slate-300">—</div>
              ) : (
                Object.entries(data.earningsByCurrency).map(([currency, total]) => (
                  <div key={currency} className="text-2xl font-bold text-emerald-600">
                    {formatAmount(total, currency)}
                  </div>
                ))
              )}
              <div className="text-xs text-slate-400 mt-1">{data.earningCount} earnings</div>
            </div>

            {/* Net (only show if same currency for spending and earning) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="text-sm font-medium text-slate-500 mb-2">Net Balance</div>
              {(() => {
                const allCurrencies = new Set([
                  ...Object.keys(data.totalsByCurrency),
                  ...Object.keys(data.earningsByCurrency),
                ]);
                const nets = Array.from(allCurrencies).map((currency) => ({
                  currency,
                  net: (data.earningsByCurrency[currency] ?? 0) - (data.totalsByCurrency[currency] ?? 0),
                }));

                if (nets.length === 0) return <div className="text-2xl font-bold text-slate-300">—</div>;

                return nets.map(({ currency, net }) => (
                  <div
                    key={currency}
                    className={`text-2xl font-bold ${net >= 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {net >= 0 ? "+" : ""}{formatAmount(Math.abs(net), currency)}
                    <span className="text-sm font-normal ml-1">{net >= 0 ? "surplus" : "deficit"}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Spending by category */}
          {data.categoryTotals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <div className="text-4xl mb-3">📊</div>
              <div className="text-slate-500 text-sm">No spending data for {getMonthName(month)} {year}.</div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Spending by Category</h2>
              {Object.entries(byCurrency).map(([currency, totals]) => {
                const grandTotal = totals.reduce((s, t) => s + t.total, 0);

                return (
                  <div key={currency} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-700">{currency}</h3>
                      <span className="text-sm font-bold text-red-600">{formatAmount(grandTotal, currency)}</span>
                    </div>

                    <div className="p-5 space-y-4">
                      {totals.map((ct) => {
                        const pct = grandTotal > 0 ? (ct.total / grandTotal) * 100 : 0;
                        const barWidth = getBarWidth(ct.total, currency, totals);

                        return (
                          <div key={`${ct.name}-${currency}`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                                  style={{ backgroundColor: ct.color + "20" }}
                                >
                                  {ct.icon}
                                </span>
                                <span className="text-sm font-medium text-slate-700">{ct.name}</span>
                                <span className="text-xs text-slate-400">({ct.count} payment{ct.count !== 1 ? "s" : ""})</span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-slate-800">
                                  {formatAmount(ct.total, currency)}
                                </span>
                                <span className="text-xs text-slate-400 ml-2">{pct.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${barWidth}%`,
                                  backgroundColor: ct.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
