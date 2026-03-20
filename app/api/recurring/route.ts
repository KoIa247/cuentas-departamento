import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const recurring = await db.recurringPayment.findMany({
      where: { isActive: true },
      include: {
        category: true,
        instances: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 1 },
      },
      orderBy: { item: "asc" },
    });
    return NextResponse.json(recurring);
  } catch {
    return NextResponse.json({ error: "Failed to fetch recurring payments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { categoryId, item, amount, currency, quantity, dayOfMonth, notes } = body;

    if (!categoryId || !item || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const recurring = await db.recurringPayment.create({
      data: {
        categoryId,
        item: item.trim(),
        amount: parseFloat(amount),
        currency: currency ?? "PEN",
        quantity: parseInt(quantity) || 1,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : null,
        notes: notes?.trim() || null,
      },
      include: { category: true },
    });

    return NextResponse.json(recurring, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create recurring payment" }, { status: 500 });
  }
}
