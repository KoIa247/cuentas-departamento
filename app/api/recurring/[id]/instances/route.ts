import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: Record<string, unknown> = { recurringPaymentId: id };
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const instances = await db.recurringInstance.findMany({ where });
    return NextResponse.json(instances);
  } catch {
    return NextResponse.json({ error: "Failed to fetch instances" }, { status: 500 });
  }
}
