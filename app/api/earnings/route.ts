import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const archive = searchParams.get("archive") === "true";

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const where: Record<string, unknown> = {};

    if (month && year) {
      where.month = parseInt(month);
      where.year = parseInt(year);
    } else if (archive) {
      where.OR = [
        { year: { lt: currentYear } },
        { year: currentYear, month: { lt: currentMonth } },
      ];
    } else {
      where.month = currentMonth;
      where.year = currentYear;
    }

    const earnings = await db.earning.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(earnings);
  } catch {
    return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, source, amount, currency, month, year, notes } = body;

    if (!date || !source || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const earning = await db.earning.create({
      data: {
        date: new Date(date),
        source: source.trim(),
        amount: parseFloat(amount),
        currency: currency ?? "PEN",
        month: parseInt(month),
        year: parseInt(year),
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(earning, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create earning" }, { status: 500 });
  }
}
