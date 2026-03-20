import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const categoryId = searchParams.get("categoryId");
    const archive = searchParams.get("archive") === "true";

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const where: Record<string, unknown> = {};

    if (month && year) {
      where.month = parseInt(month);
      where.year = parseInt(year);
    } else if (archive) {
      // Payments older than current month
      where.OR = [
        { year: { lt: currentYear } },
        { year: currentYear, month: { lt: currentMonth } },
      ];
    } else {
      where.month = currentMonth;
      where.year = currentYear;
    }

    if (categoryId) where.categoryId = categoryId;

    const payments = await db.payment.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(payments);
  } catch {
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, categoryId, item, amount, currency, quantity, month, year, notes } = body;

    if (!date || !categoryId || !item || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payment = await db.payment.create({
      data: {
        date: new Date(date),
        categoryId,
        item: item.trim(),
        amount: parseFloat(amount),
        currency: currency ?? "PEN",
        quantity: parseInt(quantity) || 1,
        month: parseInt(month),
        year: parseInt(year),
        notes: notes?.trim() || null,
      },
      include: { category: true },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
