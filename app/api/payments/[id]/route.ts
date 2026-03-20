import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.payment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const payment = await db.payment.update({
      where: { id },
      data: {
        ...(body.date && { date: new Date(body.date) }),
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.item && { item: body.item.trim() }),
        ...(body.amount !== undefined && { amount: parseFloat(body.amount) }),
        ...(body.currency && { currency: body.currency }),
        ...(body.quantity !== undefined && { quantity: parseInt(body.quantity) }),
        ...(body.notes !== undefined && { notes: body.notes?.trim() || null }),
      },
      include: { category: true },
    });

    return NextResponse.json(payment);
  } catch {
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}
