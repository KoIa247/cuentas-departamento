"use client";

import { useCallback, useEffect, useState } from "react";
import { formatAmount } from "@/lib/currencies";
import { formatDate, getMonthName, MONTH_NAMES } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Payment {
  id: string;
  date: string;
  item: string;
  amount: number;
  currency: string;
  quantity: number;
  month: number;
  year: number;
  notes: string | null;
  category: Category;
}

interface Earning {
  id: string;
  date: string;
  source: string;
  amount: number;
  currency: string;
  month: number;
  year: number;
  notes: string | null;
}

export default function ArchivePage() {
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>(now.getFullYear().toString());
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [tab, setTab] = useState<"payments" | "earnings">("payments");

  const [payments, setPayments] = useState<Payment[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Available years (current year and previous 5)
  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (filterMonth !== "all" && filterYear !== "all") {
        params.set("month", filterMonth);
        params.set("year", filterYear);
      } else if (filterYear !== "all") {
        params.set("year", filterYear);
        params.set("archive", "true");
      } else {
        params.set("archive", "true");
      }

      if (filterCategory !== "all") params.set("categoryId", filterCategory);

      const [payRes, earnRes, catRes] = await Promise.all([
        fetch(`/api/payments?${params}`),
        fetch(`/api/earnings?${params}`),
        fetch("/api/categories"),
      ]);

      const [pays, earns, cats] = await Promise.all([
        payRes.json(),
        earnRes.json(),
        catRes.json(),
      ]);

      setPayments(pays);
      setEarnings(earns);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear, filterCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group by month+year
  const groupedPayments = payments.reduce((acc, p) => {
    const key = `${p.year}-${p.month}`;
    if (!acc[key]) acc[key] = { month: p.month, year: p.year, items: [] };
    acc[key].items.push(p);
    return acc;
  }, {} as Record<string, { month: number; year: number; items: Payment[] }>);

  const groupedEarnings = earnings.reduce((acc, e) => {
    const key = `${e.year}-${e.month}`;
    if (!acc[key]) acc[key] = { month: e.month, year: e.year, items: [] };
    acc[key].items.push(e);
    return acc;
  }, {} as Record<string, { month: number; year: number; items: Earning[] }>);

  const sortedPaymentGroups = Object.values(groupedPayments).sort(
    (a, b) => b.year - a.year || b.month - a.month
  );
  const sortedEarningGroups = Object.values(groupedEarnings).sort(
    (a, b) => b.year - a.year || b.month - a.month
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Archive</h1>
        <p className="text-slate-500 mt-1">Historical payments and earnings (older than current month)</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Year</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Month</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All months</option>
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setFilterMonth("all");
              setFilterYear(now.getFullYear().toString());
              setFilterCategory("all");
            }}
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {(["payments", "earnings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "payments" ? `Payments (${payments.length})` : `Earnings (${earnings.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === "payments" && (
            <div className="space-y-6">
              {sortedPaymentGroups.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                  <div className="text-4xl mb-3">📦</div>
                  <div className="text-slate-500 text-sm">No archived payments found.</div>
                </div>
              ) : (
                sortedPaymentGroups.map((group) => {
                  const totalByCurrency = group.items.reduce((acc, p) => {
                    acc[p.currency] = (acc[p.currency] ?? 0) + p.amount * p.quantity;
                    return acc;
                  }, {} as Record<string, number>);

                  return (
                    <div key={`${group.year}-${group.month}`} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-700">
                          {getMonthName(group.month)} {group.year}
                        </h3>
                        <div className="flex gap-4">
                          {Object.entries(totalByCurrency).map(([currency, total]) => (
                            <span key={currency} className="text-sm font-semibold text-red-600">
                              -{formatAmount(total, currency)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <table className="w-full">
                        <tbody className="divide-y divide-slate-50">
                          {group.items.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="px-5 py-3 text-sm text-slate-400 w-28">{formatDate(p.date)}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                                    style={{ backgroundColor: p.category.color + "20" }}
                                  >
                                    {p.category.icon}
                                  </span>
                                  <span className="text-xs text-slate-500">{p.category.name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-700 font-medium">
                                {p.item}
                                {p.notes && <span className="block text-xs text-slate-400 font-normal">{p.notes}</span>}
                              </td>
                              <td className="px-5 py-3 text-xs text-slate-400">qty {p.quantity}</td>
                              <td className="px-5 py-3 text-sm font-semibold text-red-500 text-right">
                                -{formatAmount(p.amount * p.quantity, p.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "earnings" && (
            <div className="space-y-6">
              {sortedEarningGroups.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                  <div className="text-4xl mb-3">💰</div>
                  <div className="text-slate-500 text-sm">No archived earnings found.</div>
                </div>
              ) : (
                sortedEarningGroups.map((group) => {
                  const totalByCurrency = group.items.reduce((acc, e) => {
                    acc[e.currency] = (acc[e.currency] ?? 0) + e.amount;
                    return acc;
                  }, {} as Record<string, number>);

                  return (
                    <div key={`${group.year}-${group.month}`} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-700">
                          {getMonthName(group.month)} {group.year}
                        </h3>
                        <div className="flex gap-4">
                          {Object.entries(totalByCurrency).map(([currency, total]) => (
                            <span key={currency} className="text-sm font-semibold text-emerald-600">
                              +{formatAmount(total, currency)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <table className="w-full">
                        <tbody className="divide-y divide-slate-50">
                          {group.items.map((e) => (
                            <tr key={e.id} className="hover:bg-slate-50">
                              <td className="px-5 py-3 text-sm text-slate-400 w-28">{formatDate(e.date)}</td>
                              <td className="px-5 py-3 text-sm text-slate-700 font-medium">
                                {e.source}
                                {e.notes && <span className="block text-xs text-slate-400 font-normal">{e.notes}</span>}
                              </td>
                              <td className="px-5 py-3 text-sm font-semibold text-emerald-600 text-right">
                                +{formatAmount(e.amount, e.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
