"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import CategoryForm from "@/components/CategoryForm";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  _count?: { payments: number; recurringPayments: number };
}

type ModalState =
  | { type: "add" }
  | { type: "edit"; category: Category }
  | null;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    setDeleteError(null);
    if (!confirm(`Delete category "${name}"? This only works if no payments are using it.`)) return;

    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setDeleteError(data.error ?? "Failed to delete category.");
    } else {
      fetchCategories();
    }
  };

  const handleSuccess = () => {
    setModal(null);
    fetchCategories();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Categories</h1>
          <p className="text-slate-500 mt-1">Manage your spending categories</p>
        </div>
        <button
          onClick={() => setModal({ type: "add" })}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          + New Category
        </button>
      </div>

      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {deleteError}
          <button onClick={() => setDeleteError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">🏷️</div>
          <div className="text-slate-500 text-sm">No categories yet.</div>
          <button
            onClick={() => setModal({ type: "add" })}
            className="mt-4 text-blue-600 text-sm hover:underline"
          >
            Create your first category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 group"
            >
              {/* Icon + color */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{
                  backgroundColor: cat.color + "20",
                  border: `2px solid ${cat.color}30`,
                }}
              >
                {cat.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800">{cat.name}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs text-slate-400 font-mono">{cat.color}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setModal({ type: "edit", category: cat })}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors text-sm"
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <button
            onClick={() => setModal({ type: "add" })}
            className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-5 flex flex-col items-center justify-center gap-2 hover:border-blue-300 hover:bg-blue-50/50 transition-all group min-h-[88px]"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 text-xl transition-colors">
              +
            </div>
            <span className="text-sm text-slate-400 group-hover:text-blue-500 transition-colors font-medium">
              New Category
            </span>
          </button>
        </div>
      )}

      {/* Modals */}
      {modal?.type === "add" && (
        <Modal title="New Category" onClose={() => setModal(null)}>
          <CategoryForm onSuccess={handleSuccess} />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal title="Edit Category" onClose={() => setModal(null)}>
          <CategoryForm onSuccess={handleSuccess} initial={modal.category} />
        </Modal>
      )}
    </div>
  );
}
