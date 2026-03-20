"use client";

import { useState } from "react";
import { CURRENCIES } from "@/lib/currencies";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface RecurringPaymentFormProps {
  categories: Category[];
  onSuccess: () => void;
  initial?: {
    id: string;
    categoryId: string;
    item: string;
    amount: number;
    currency: string;
    quantity: number;
    dayOfMonth: number | null;
    notes: string | null;
  };
}

export default function RecurringPaymentForm({
  categories,
  onSuccess,
  initial,
}: RecurringPaymentFormProps) {
  const [form, setForm] = useState({
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    item: initial?.item ?? "",
    amount: initial?.amount?.toString() ?? "",
    currency: initial?.currency ?? "USD",
    quantity: initial?.quantity?.toString() ?? "1",
    dayOfMonth: initial?.dayOfMonth?.toString() ?? "",
    notes: initial?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.categoryId || !form.item || !form.amount) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const url = initial ? `/api/recurring/${initial.id}` : "/api/recurring";
      const method = initial ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          quantity: parseInt(form.quantity) || 1,
          dayOfMonth: form.dayOfMonth ? parseInt(form.dayOfMonth) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        Recurring payments appear every month until deactivated. Mark them as paid each month.
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          value={form.categoryId}
          onChange={(e) => set("categoryId", e.target.value)}
          required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="">Select category...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Item */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Item / Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.item}
          onChange={(e) => set("item", e.target.value)}
          placeholder="e.g. Rent, Netflix, Electricity"
          required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Amount + Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Currency
          </label>
          <select
            value={form.currency}
            onChange={(e) => set("currency", e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} {c.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quantity + Day of Month */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => set("quantity", e.target.value)}
            min="1"
            step="1"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Expected Day of Month
          </label>
          <input
            type="number"
            value={form.dayOfMonth}
            onChange={(e) => set("dayOfMonth", e.target.value)}
            placeholder="e.g. 1, 15, 28"
            min="1"
            max="31"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any additional details..."
          rows={2}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-60"
        >
          {loading ? "Saving..." : initial ? "Update Recurring Payment" : "Add Recurring Payment"}
        </button>
      </div>
    </form>
  );
}
