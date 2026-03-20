import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Mark a recurring payment as paid for a given month/year
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { month, year, paidDate } = body;

    if (!month || !year) {
      return NextResponse.json({ error: "month and year are required" }, { status: 400 });
    }

    const instance = await db.recurringInstance.upsert({
      where: {
        recurringPaymentId_month_year: {
          recurringPaymentId: id,
          month: parseInt(month),
          year: parseInt(year),
        },
      },
      update: {
        isPaid: true,
        paidDate: paidDate ? new Date(paidDate) : new Date(),
      },
      create: {
        recurringPaymentId: id,
        month: parseInt(month),
        year: parseInt(year),
        isPaid: true,
        paidDate: paidDate ? new Date(paidDate) : new Date(),
      },
    });

    return NextResponse.json(instance);
  } catch {
    return NextResponse.json({ error: "Failed to mark as paid" }, { status: 500 });
  }
}

// Mark as unpaid
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { month, year } = body;

    await db.recurringInstance.updateMany({
      where: {
        recurringPaymentId: id,
        month: parseInt(month),
        year: parseInt(year),
      },
      data: { isPaid: false, paidDate: null },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to mark as unpaid" }, { status: 500 });
  }
}
