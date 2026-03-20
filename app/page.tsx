import { db } from "@/lib/db";
import { getMonthName } from "@/lib/utils";
import { formatAmount } from "@/lib/currencies";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // One-time payments this month
  const payments = await db.payment.findMany({
    where: { month, year },
    include: { category: true },
    orderBy: { date: "desc" },
    take: 5,
  });

  // Recurring payments this month
  const recurringPayments = await db.recurringPayment.findMany({
    where: { isActive: true },
    include: {
      category: true,
      instances: {
        where: { month, year },
      },
    },
  });

  // Earnings this month
  const earnings = await db.earning.findMany({
    where: { month, year },
  });

  // Totals per currency from one-time payments
  const spendByCurrency: Record<string, number> = {};
  for (const p of payments) {
    spendByCurrency[p.currency] = (spendByCurrency[p.currency] ?? 0) + p.amount * p.quantity;
  }
  // Add paid recurring
  for (const rp of recurringPayments) {
    const paid = rp.instances.some((i) => i.isPaid);
    if (paid) {
      spendByCurrency[rp.currency] = (spendByCurrency[rp.currency] ?? 0) + rp.amount * rp.quantity;
    }
  }

  const earnByCurrency: Record<string, number> = {};
  for (const e of earnings) {
    earnByCurrency[e.currency] = (earnByCurrency[e.currency] ?? 0) + e.amount;
  }

  const unpaidRecurring = recurringPayments.filter(
    (rp) => !rp.instances.some((i) => i.isPaid)
  );

  const totalCategories = await db.category.count();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          {getMonthName(month)} {year} &bull; Overview
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Spent */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl">💸</div>
            <div className="text-sm text-slate-500 font-medium">Total Spent</div>
          </div>
          <div className="space-y-0.5">
            {Object.entries(spendByCurrency).length === 0 ? (
              <div className="text-lg font-bold text-slate-300">—</div>
            ) : (
              Object.entries(spendByCurrency).map(([currency, total]) => (
                <div key={currency} className="text-lg font-bold text-slate-800">
                  {formatAmount(total, currency)}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total Earned */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">💰</div>
            <div className="text-sm text-slate-500 font-medium">Total Earned</div>
          </div>
          <div className="space-y-0.5">
            {Object.entries(earnByCurrency).length === 0 ? (
              <div className="text-lg font-bold text-slate-300">—</div>
            ) : (
              Object.entries(earnByCurrency).map(([currency, total]) => (
                <div key={currency} className="text-lg font-bold text-emerald-700">
                  {formatAmount(total, currency)}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unpaid Recurring */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl">🔔</div>
            <div className="text-sm text-slate-500 font-medium">Unpaid Bills</div>
          </div>
          <div className="text-3xl font-bold text-amber-600">{unpaidRecurring.length}</div>
          <div className="text-xs text-slate-400 mt-1">recurring this month</div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">🏷️</div>
            <div className="text-sm text-slate-500 font-medium">Categories</div>
          </div>
          <div className="text-3xl font-bold text-blue-600">{totalCategories}</div>
          <div className="text-xs text-slate-400 mt-1">active categories</div>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Recent Payments</h2>
            <Link href="/tracker" className="text-blue-600 text-sm hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {payments.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                No payments this month yet.
                <br />
                <Link href="/tracker" className="text-blue-600 hover:underline mt-1 inline-block">
                  Add one in Tracker
                </Link>
              </div>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: p.category.color + "20" }}
                  >
                    {p.category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">{p.item}</div>
                    <div className="text-xs text-slate-400">{p.category.name}</div>
                  </div>
                  <div className="text-sm font-semibold text-red-600 flex-shrink-0">
                    -{formatAmount(p.amount * p.quantity, p.currency)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unpaid Recurring */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Unpaid Recurring Bills</h2>
            <Link href="/tracker" className="text-blue-600 text-sm hover:underline">
              Pay in Tracker
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {unpaidRecurring.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                All recurring bills paid! 🎉
              </div>
            ) : (
              unpaidRecurring.slice(0, 5).map((rp) => (
                <div key={rp.id} className="flex items-center gap-3 px-5 py-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: rp.category.color + "20" }}
                  >
                    {rp.category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">{rp.item}</div>
                    <div className="text-xs text-slate-400">
                      {rp.category.name}
                      {rp.dayOfMonth && ` · due day ${rp.dayOfMonth}`}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-amber-600 flex-shrink-0">
                    {formatAmount(rp.amount * rp.quantity, rp.currency)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
