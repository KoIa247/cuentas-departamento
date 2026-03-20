"use client";

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/Modal";
import PaymentForm from "@/components/PaymentForm";
import RecurringPaymentForm from "@/components/RecurringPaymentForm";
import EarningForm from "@/components/EarningForm";
import { formatAmount } from "@/lib/currencies";
import { formatDate, getMonthName } from "@/lib/utils";

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
  notes: string | null;
  category: Category;
}

interface RecurringPayment {
  id: string;
  categoryId: string;
  item: string;
  amount: number;
  currency: string;
  quantity: number;
  dayOfMonth: number | null;
  notes: string | null;
  isActive: boolean;
  category: Category;
  instances: Array<{ id: string; isPaid: boolean; paidDate: string | null; month: number; year: number }>;
}

interface Earning {
  id: string;
  date: string;
  source: string;
  amount: number;
  currency: string;
  notes: string | null;
}

type ModalType =
  | { type: "addPayment" }
  | { type: "addRecurring" }
  | { type: "addEarning" }
  | { type: "editRecurring"; data: RecurringPayment }
  | null;

export default function TrackerPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [categories, setCategories] = useState<Category[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [recurring, setRecurring] = useState<RecurringPayment[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [tab, setTab] = useState<"payments" | "recurring" | "earnings">("payments");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, payRes, recRes, earnRes] = await Promise.all([
        fetch("/api/categories"),
        fetch(`/api/payments?month=${month}&year=${year}`),
        fetch("/api/recurring"),
        fetch(`/api/earnings?month=${month}&year=${year}`),
      ]);

      const [cats, pays, recs, earns] = await Promise.all([
        catRes.json(),
        payRes.json(),
        recRes.json(),
        earnRes.json(),
      ]);

      // Attach instances for current month to recurring
      const recsWithInstances = await Promise.all(
        recs.map(async (rp: RecurringPayment) => {
          // Instances are already fetched (last 1), refetch for this month
          const instRes = await fetch(
            `/api/recurring/${rp.id}/instances?month=${month}&year=${year}`
          );
          if (instRes.ok) {
            const instances = await instRes.json();
            return { ...rp, instances };
          }
          return { ...rp, instances: [] };
        })
      );

      setCategories(cats);
      setPayments(pays);
      setRecurring(recsWithInstances);
      setEarnings(earns);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const closeModal = () => setModal(null);
  const handleSuccess = () => {
    closeModal();
    fetchData();
  };

  const deletePayment = async (id: string) => {
    if (!confirm("Delete this payment?")) return;
    await fetch(`/api/payments/${id}`, { method: "DELETE" });
    fetchData();
  };

  const deleteEarning = async (id: string) => {
    if (!confirm("Delete this earning?")) return;
    await fetch(`/api/earnings/${id}`, { method: "DELETE" });
    fetchData();
  };

  const toggleRecurringPaid = async (rp: RecurringPayment) => {
    const instance = rp.instances.find((i) => i.month === month && i.year === year);
    const isPaid = instance?.isPaid ?? false;

    if (isPaid) {
      await fetch(`/api/recurring/${rp.id}/pay`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });
    } else {
      await fetch(`/api/recurring/${rp.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });
    }
    fetchData();
  };

  const deactivateRecurring = async (id: string) => {
    if (!confirm("Deactivate this recurring payment? It won't appear in future months.")) return;
    await fetch(`/api/recurring/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    fetchData();
  };

  const navigateMonth = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  };

  const isCurrentMonthView = month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tracker</h1>
          <p className="text-slate-500 mt-1">Manage your monthly payments &amp; earnings</p>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
          <button
            onClick={() => navigateMonth(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-slate-700 min-w-[120px] text-center">
            {getMonthName(month)} {year}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {(["payments", "recurring", "earnings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "payments" ? "One-time" : t === "recurring" ? "Recurring" : "Earnings"}
            {t === "payments" && (
              <span className="ml-1.5 bg-slate-200 text-slate-600 text-xs rounded-full px-1.5 py-0.5">
                {payments.length}
              </span>
            )}
            {t === "recurring" && (
              <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs rounded-full px-1.5 py-0.5">
                {recurring.filter((r) => !r.instances.find((i) => i.month === month && i.year === year && i.isPaid)).length} unpaid
              </span>
            )}
            {t === "earnings" && (
              <span className="ml-1.5 bg-emerald-100 text-emerald-700 text-xs rounded-full px-1.5 py-0.5">
                {earnings.length}
              </span>
            )}
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
          {/* ONE-TIME PAYMENTS TAB */}
          {tab === "payments" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-700">
                  One-time Payments
                  {!isCurrentMonthView && (
                    <span className="ml-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                      Viewing past month
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setModal({ type: "addPayment" })}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  + Add Payment
                </button>
              </div>

              {payments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                  <div className="text-4xl mb-3">💸</div>
                  <div className="text-slate-500 text-sm">No payments recorded for this month.</div>
                  <button
                    onClick={() => setModal({ type: "addPayment" })}
                    className="mt-4 text-blue-600 text-sm hover:underline"
                  >
                    Add your first payment
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Date</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Category</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Item</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Qty</th>
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Total</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 text-sm text-slate-500">{formatDate(p.date)}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                                style={{ backgroundColor: p.category.color + "20" }}
                              >
                                {p.category.icon}
                              </span>
                              <span className="text-sm text-slate-600">{p.category.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-800 font-medium">
                            {p.item}
                            {p.notes && (
                              <span className="block text-xs text-slate-400 font-normal">{p.notes}</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-500">{p.quantity}</td>
                          <td className="px-5 py-3 text-sm font-semibold text-red-600 text-right">
                            {formatAmount(p.amount * p.quantity, p.currency)}
                            {p.quantity > 1 && (
                              <span className="block text-xs font-normal text-slate-400">
                                {formatAmount(p.amount, p.currency)} each
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => deletePayment(p.id)}
                              className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                              title="Delete"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Summary row */}
                  <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 flex justify-end gap-6">
                    {Object.entries(
                      payments.reduce((acc, p) => {
                        acc[p.currency] = (acc[p.currency] ?? 0) + p.amount * p.quantity;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([currency, total]) => (
                      <div key={currency} className="text-sm font-semibold text-slate-700">
                        Total: <span className="text-red-600">{formatAmount(total, currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RECURRING TAB */}
          {tab === "recurring" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-700">Recurring Payments</h2>
                <button
                  onClick={() => setModal({ type: "addRecurring" })}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  + Add Recurring
                </button>
              </div>

              {recurring.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                  <div className="text-4xl mb-3">🔁</div>
                  <div className="text-slate-500 text-sm">No recurring payments set up yet.</div>
                  <button
                    onClick={() => setModal({ type: "addRecurring" })}
                    className="mt-4 text-blue-600 text-sm hover:underline"
                  >
                    Add your first recurring payment
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recurring.map((rp) => {
                    const instance = rp.instances.find((i) => i.month === month && i.year === year);
                    const isPaid = instance?.isPaid ?? false;

                    return (
                      <div
                        key={rp.id}
                        className={`bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-4 transition-all ${
                          isPaid ? "border-emerald-200 bg-emerald-50/50" : "border-slate-100"
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleRecurringPaid(rp)}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isPaid
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300 hover:border-emerald-400"
                          }`}
                        >
                          {isPaid && "✓"}
                        </button>

                        {/* Category */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: rp.category.color + "20" }}
                        >
                          {rp.category.icon}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm ${isPaid ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {rp.item}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {rp.category.name}
                            {rp.dayOfMonth && ` · Due day ${rp.dayOfMonth}`}
                            {isPaid && instance?.paidDate && ` · Paid ${formatDate(instance.paidDate)}`}
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-sm font-semibold text-slate-700 text-right flex-shrink-0">
                          {formatAmount(rp.amount * rp.quantity, rp.currency)}
                          {rp.quantity > 1 && (
                            <span className="block text-xs font-normal text-slate-400">
                              qty {rp.quantity}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setModal({ type: "editRecurring", data: rp })}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors text-sm"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => deactivateRecurring(rp.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                            title="Deactivate"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* EARNINGS TAB */}
          {tab === "earnings" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-700">Earnings</h2>
                <button
                  onClick={() => setModal({ type: "addEarning" })}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  + Add Earning
                </button>
              </div>

              {earnings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                  <div className="text-4xl mb-3">💰</div>
                  <div className="text-slate-500 text-sm">No earnings recorded for this month.</div>
                  <button
                    onClick={() => setModal({ type: "addEarning" })}
                    className="mt-4 text-emerald-600 text-sm hover:underline"
                  >
                    Add your first earning
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Date</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Source</th>
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Amount</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {earnings.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 text-sm text-slate-500">{formatDate(e.date)}</td>
                          <td className="px-5 py-3 text-sm text-slate-800 font-medium">
                            {e.source}
                            {e.notes && (
                              <span className="block text-xs text-slate-400 font-normal">{e.notes}</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-sm font-semibold text-emerald-600 text-right">
                            +{formatAmount(e.amount, e.currency)}
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => deleteEarning(e.id)}
                              className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 flex justify-end gap-6">
                    {Object.entries(
                      earnings.reduce((acc, e) => {
                        acc[e.currency] = (acc[e.currency] ?? 0) + e.amount;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([currency, total]) => (
                      <div key={currency} className="text-sm font-semibold text-slate-700">
                        Total: <span className="text-emerald-600">+{formatAmount(total, currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {modal?.type === "addPayment" && (
        <Modal title="Add Payment" onClose={closeModal}>
          <PaymentForm
            categories={categories}
            onSuccess={handleSuccess}
            defaultMonth={month}
            defaultYear={year}
          />
        </Modal>
      )}

      {modal?.type === "addRecurring" && (
        <Modal title="Add Recurring Payment" onClose={closeModal}>
          <RecurringPaymentForm categories={categories} onSuccess={handleSuccess} />
        </Modal>
      )}

      {modal?.type === "editRecurring" && (
        <Modal title="Edit Recurring Payment" onClose={closeModal}>
          <RecurringPaymentForm
            categories={categories}
            onSuccess={handleSuccess}
            initial={modal.data}
          />
        </Modal>
      )}

      {modal?.type === "addEarning" && (
        <Modal title="Add Earning" onClose={closeModal}>
          <EarningForm onSuccess={handleSuccess} defaultMonth={month} defaultYear={year} />
        </Modal>
      )}
    </div>
  );
}
