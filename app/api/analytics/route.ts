import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") ?? "");
    const year = parseInt(searchParams.get("year") ?? "");

    if (!month || !year) {
      return NextResponse.json({ error: "month and year are required" }, { status: 400 });
    }

    // One-time payments
    const payments = await db.payment.findMany({
      where: { month, year },
      include: { category: true },
    });

    // Recurring payments paid this month
    const recurringInstances = await db.recurringInstance.findMany({
      where: { month, year, isPaid: true },
      include: {
        recurringPayment: {
          include: { category: true },
        },
      },
    });

    // Earnings
    const earnings = await db.earning.findMany({
      where: { month, year },
    });

    // Aggregate by category
    const categoryTotals: Record<
      string,
      { name: string; color: string; icon: string; total: number; currency: string; count: number }
    > = {};

    for (const p of payments) {
      const key = `${p.categoryId}-${p.currency}`;
      if (!categoryTotals[key]) {
        categoryTotals[key] = {
          name: p.category.name,
          color: p.category.color,
          icon: p.category.icon,
          total: 0,
          currency: p.currency,
          count: 0,
        };
      }
      categoryTotals[key].total += p.amount * p.quantity;
      categoryTotals[key].count += 1;
    }

    for (const inst of recurringInstances) {
      const rp = inst.recurringPayment;
      const key = `${rp.categoryId}-${rp.currency}`;
      if (!categoryTotals[key]) {
        categoryTotals[key] = {
          name: rp.category.name,
          color: rp.category.color,
          icon: rp.category.icon,
          total: 0,
          currency: rp.currency,
          count: 0,
        };
      }
      categoryTotals[key].total += rp.amount * rp.quantity;
      categoryTotals[key].count += 1;
    }

    // Total spending per currency
    const totalsByCurrency: Record<string, number> = {};
    for (const item of Object.values(categoryTotals)) {
      totalsByCurrency[item.currency] = (totalsByCurrency[item.currency] ?? 0) + item.total;
    }

    // Total earnings per currency
    const earningsByCurrency: Record<string, number> = {};
    for (const e of earnings) {
      earningsByCurrency[e.currency] = (earningsByCurrency[e.currency] ?? 0) + e.amount;
    }

    return NextResponse.json({
      categoryTotals: Object.values(categoryTotals).sort((a, b) => b.total - a.total),
      totalsByCurrency,
      earningsByCurrency,
      paymentCount: payments.length + recurringInstances.length,
      earningCount: earnings.length,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
