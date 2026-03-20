"use client";

import { useState } from "react";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#10b981", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#ec4899", "#64748b", "#6b7280",
];

const PRESET_ICONS = [
  "🏠", "🛒", "🚗", "⚡", "💊", "🎬", "👗", "💰",
  "📱", "🍽️", "✈️", "🎓", "🐾", "🏋️", "🎮", "📦",
  "🔧", "👶", "💼", "🎁", "🏦", "🌿", "🚿", "📚",
];

interface CategoryFormProps {
  onSuccess: () => void;
  initial?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}

export default function CategoryForm({ onSuccess, initial }: CategoryFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    color: initial?.color ?? "#6366f1",
    icon: initial?.icon ?? "📦",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    setLoading(true);
    try {
      const url = initial ? `/api/categories/${initial.id}` : "/api/categories";
      const method = initial ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save category");
      }

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

      {/* Preview */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: form.color + "20", border: `2px solid ${form.color}` }}
        >
          {form.icon}
        </div>
        <div>
          <div className="font-medium text-slate-800">{form.name || "Category Name"}</div>
          <div className="text-xs text-slate-500">Preview</div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="e.g. Housing, Food, Transport"
          required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Icon */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Icon</label>
        <div className="grid grid-cols-8 gap-1.5">
          {PRESET_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setForm((p) => ({ ...p, icon }))}
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                form.icon === icon
                  ? "bg-blue-100 ring-2 ring-blue-500"
                  : "hover:bg-slate-100"
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm((p) => ({ ...p, color }))}
              className={`w-8 h-8 rounded-full transition-transform ${
                form.color === color ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "hover:scale-105"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          {/* Custom color */}
          <label className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-400 overflow-hidden">
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
              className="opacity-0 absolute"
            />
            <span className="text-slate-400 text-xs">+</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-60"
      >
        {loading ? "Saving..." : initial ? "Update Category" : "Create Category"}
      </button>
    </form>
  );
}
