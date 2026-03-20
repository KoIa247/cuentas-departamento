"use client";

import { useState } from "react";
import { CURRENCIES } from "@/lib/currencies";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface PaymentFormProps {
  categories: Category[];
  onSuccess: () => void;
  defaultMonth: number;
  defaultYear: number;
}

export default function PaymentForm({
  categories,
  onSuccess,
  defaultMonth,
  defaultYear,
}: PaymentFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date: today,
    categoryId: categories[0]?.id ?? "",
    item: "",
    amount: "",
    currency: "PEN",
    quantity: "1",
    notes: "",
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
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          quantity: parseInt(form.quantity) || 1,
          month: defaultMonth,
          year: defaultYear,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save payment");
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

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Date of Payment <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
          required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
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
          placeholder="e.g. Netflix subscription"
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

      {/* Quantity */}
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
          {loading ? "Saving..." : "Save Payment"}
        </button>
      </div>
    </form>
  );
}
