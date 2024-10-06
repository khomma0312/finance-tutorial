import { Hono } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { subDays, parse, differenceInDays } from "date-fns";
import { db } from "@/db/drizzle";
import { accounts, categories, transactions } from "@/db/schema";
import { and, between, desc, eq, lt, sql, sum } from "drizzle-orm";
import { calculatePercentageChange, fillMissingDates } from "@/lib/utils";

const app = new Hono().get(
  "/",
  clerkMiddleware(),
  zValidator(
    "query",
    z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      accountId: z.string().optional(),
    })
  ),
  async (c) => {
    const auth = getAuth(c);
    const { from, to, accountId } = c.req.valid("query");

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const defaultTo = new Date();
    const defaultFrom = subDays(defaultTo, 30);

    const startDate = from
      ? parse(from, "yyyy-MM-dd", new Date())
      : defaultFrom;
    const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;

    const periodLength = differenceInDays(endDate, startDate) + 1;

    const lastPeriodStart = subDays(startDate, periodLength);
    const lastPeriodEnd = subDays(endDate, periodLength);

    const [currentPeriodData] = await fetchFinancialData(
      auth.userId,
      accountId ?? "",
      startDate,
      endDate
    );

    const [lastPeriodData] = await fetchFinancialData(
      auth.userId,
      accountId ?? "",
      lastPeriodStart,
      lastPeriodEnd
    );

    const incomeChange = calculatePercentageChange(
      currentPeriodData.income,
      lastPeriodData.income
    );

    const expensesChange = calculatePercentageChange(
      currentPeriodData.expenses,
      lastPeriodData.expenses
    );

    const remainingChange = calculatePercentageChange(
      currentPeriodData.remaining,
      lastPeriodData.remaining
    );

    const category = await db
      .select({
        name: categories.name,
        value: sql`SUM(ABS(${transactions.amount}))`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .innerJoin(categories, eq(categories.id, transactions.categoryId))
      .where(
        and(
          eq(accounts.userId, auth.userId),
          accountId ? eq(accounts.id, accountId) : undefined,
          between(transactions.date, startDate, endDate),
          lt(transactions.amount, 0)
        )
      )
      .groupBy(categories.name)
      .orderBy(desc(sql`SUM(ABS(${transactions.amount}))`));

    const topCategories = category.slice(0, 3);
    const otherCategories = category.slice(3);
    const otherSum = otherCategories.reduce((acc, cur) => acc + cur.value, 0);

    const finalCategories =
      otherCategories.length > 0
        ? [
            ...topCategories,
            {
              name: "Other",
              value: otherSum,
            },
          ]
        : topCategories;

    const activeDays = await db
      .select({
        date: transactions.date,
        income:
          sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
            Number
          ),
        expenses:
          sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END)`.mapWith(
            Number
          ),
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .where(
        and(
          accountId ? eq(accounts.id, accountId) : undefined,
          eq(accounts.userId, auth.userId),
          between(transactions.date, startDate, endDate)
        )
      )
      .groupBy(transactions.date)
      .orderBy(transactions.date);

    const days = fillMissingDates(activeDays, startDate, endDate);

    return c.json({
      data: {
        remainingAmount: currentPeriodData.remaining,
        remainingChange,
        incomeAmount: currentPeriodData.income,
        incomeChange,
        expensesAmount: currentPeriodData.expenses,
        expensesChange,
        categories: finalCategories,
        days,
      },
    });
  }
);

async function fetchFinancialData(
  userId: string,
  accountId: string,
  startDate: Date,
  endDate: Date
) {
  return await db
    .select({
      income:
        sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
          Number
        ),
      expenses:
        sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
          Number
        ),
      remaining: sum(transactions.amount).mapWith(Number),
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .where(
      and(
        accountId ? eq(accounts.id, accountId) : undefined,
        eq(accounts.userId, userId),
        between(transactions.date, startDate, endDate)
      )
    );
}

export default app;
