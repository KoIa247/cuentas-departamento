import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const recurring = await db.recurringPayment.update({
      where: { id },
      data: {
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.item && { item: body.item.trim() }),
        ...(body.amount !== undefined && { amount: parseFloat(body.amount) }),
        ...(body.currency && { currency: body.currency }),
        ...(body.quantity !== undefined && { quantity: parseInt(body.quantity) }),
        ...(body.dayOfMonth !== undefined && {
          dayOfMonth: body.dayOfMonth ? parseInt(body.dayOfMonth) : null,
        }),
        ...(body.notes !== undefined && { notes: body.notes?.trim() || null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: { category: true },
    });

    return NextResponse.json(recurring);
  } catch {
    return NextResponse.json({ error: "Failed to update recurring payment" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.recurringPayment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete recurring payment" }, { status: 500 });
  }
}
