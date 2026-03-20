import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "Housing", color: "#ef4444", icon: "🏠" },
  { name: "Food & Groceries", color: "#f97316", icon: "🛒" },
  { name: "Transport", color: "#eab308", icon: "🚗" },
  { name: "Utilities", color: "#22c55e", icon: "⚡" },
  { name: "Entertainment", color: "#8b5cf6", icon: "🎬" },
  { name: "Health", color: "#06b6d4", icon: "💊" },
  { name: "Clothing", color: "#ec4899", icon: "👗" },
  { name: "Savings", color: "#10b981", icon: "💰" },
  { name: "Other", color: "#6b7280", icon: "📦" },
];

async function main() {
  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (!existing) {
      await prisma.category.create({ data: cat });
      console.log(`Created: ${cat.icon} ${cat.name}`);
    } else {
      console.log(`Skipped (exists): ${cat.name}`);
    }
  }
  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
