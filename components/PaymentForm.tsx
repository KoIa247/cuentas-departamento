"use client";

import { useState } from "react";
import { CURRENCIES } from "@/lib/currencies";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface PaymentLine {
  localId: number;
  categoryId: string;
  item: string;
  amount: string;
  quantity: string;
}

interface PaymentFormProps {
  categories: Category[];
  onSuccess: () => void;
  defaultMonth: number;
  defaultYear: number;
}

let localIdCounter = 0;
const newLine = (defaultCategoryId: string): PaymentLine => ({
  localId: ++localIdCounter,
  categoryId: defaultCategoryId,
  item: "",
  amount: "",
  quantity: "1",
});

export default function PaymentForm({
  categories,
  onSuccess,
  defaultMonth,
  defaultYear,
}: PaymentFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const defaultCat = categories[0]?.id ?? "";

  const [date, setDate] = useState(today);
  const [currency, setCurrency] = useState("PEN");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<PaymentLine[]>([newLine(defaultCat)]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateLine = (localId: number, field: keyof PaymentLine, value: string) => {
    setLines((prev) =>
      prev.map((l) => (l.localId === localId ? { ...l, [field]: value } : l))
    );
  };

  const addLine = () => setLines((prev) => [...prev, newLine(defaultCat)]);

  const removeLine = (localId: number) => {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((l) => l.localId !== localId));
  };

  const total = lines.reduce((sum, l) => {
    const amt = parseFloat(l.amount) || 0;
    const qty = parseInt(l.quantity) || 1;
    return sum + amt * qty;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    for (const l of lines) {
      if (!l.categoryId || !l.item.trim() || !l.amount) {
        setError("Please fill in category, item, and amount for every row.");
        return;
      }
    }

    setLoading(true);
    try {
      await Promise.all(
        lines.map((l) =>
          fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date,
              categoryId: l.categoryId,
              item: l.item.trim(),
              amount: parseFloat(l.amount),
              currency,
              quantity: parseInt(l.quantity) || 1,
              month: defaultMonth,
              year: defaultYear,
              notes: notes.trim() || null,
            }),
          }).then((r) => {
            if (!r.ok) throw new Error(`Failed to save "${l.item}"`);
          })
        )
      );
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Date + Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
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

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">Items</label>
          <span className="text-xs text-slate-400">
            {lines.length} item{lines.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Column headers */}
        <div className="grid gap-2 px-1 mb-1" style={{ gridTemplateColumns: "1fr 2fr 1fr 52px 28px" }}>
          <span className="text-xs text-slate-400">Category</span>
          <span className="text-xs text-slate-400">Item</span>
          <span className="text-xs text-slate-400">Amount</span>
          <span className="text-xs text-slate-400 text-center">Qty</span>
          <span />
        </div>

        <div className="space-y-2">
          {lines.map((line) => (
            <div
              key={line.localId}
              className="grid gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100"
              style={{ gridTemplateColumns: "1fr 2fr 1fr 52px 28px" }}
            >
              <select
                value={line.categoryId}
                onChange={(e) => updateLine(line.localId, "categoryId", e.target.value)}
                required
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 min-w-0"
              >
                <option value="">Cat…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={line.item}
                onChange={(e) => updateLine(line.localId, "item", e.target.value)}
                placeholder="Item name…"
                required
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 min-w-0"
              />

              <input
                type="number"
                value={line.amount}
                onChange={(e) => updateLine(line.localId, "amount", e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 min-w-0"
              />

              <input
                type="number"
                value={line.quantity}
                onChange={(e) => updateLine(line.localId, "quantity", e.target.value)}
                min="1"
                step="1"
                title="Quantity"
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-blue-500 min-w-0"
              />

              <button
                type="button"
                onClick={() => removeLine(line.localId)}
                disabled={lines.length === 1}
                className="flex items-center justify-center rounded-lg hover:bg-red-100 text-slate-300 hover:text-red-400 transition-colors text-xl leading-none disabled:opacity-20 disabled:cursor-not-allowed"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addLine}
          className="mt-2 w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all"
        >
          + Add another item
        </button>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Notes (optional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Weekly grocery run"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Total + Submit */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="text-sm text-slate-500">
          Total:{" "}
          <span className="font-semibold text-slate-800">
            {currency === "PEN" ? "S/" : "$"}
            {total.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            {currency}
          </span>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors disabled:opacity-60"
        >
          {loading
            ? "Saving…"
            : `Save ${lines.length > 1 ? `${lines.length} items` : "Payment"}`}
        </button>
      </div>
    </form>
  );
}
