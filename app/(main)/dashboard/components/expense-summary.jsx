"use client";

import { useCurrency } from "@/components/currency-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CHART_COLOR = "#20c997";

export function ExpenseSummary({ monthlySpending, totalSpent }) {
  const { format } = useCurrency();
  const currentYear = new Date().getFullYear();
  const now = new Date();

  const thisMonthTotal =
    monthlySpending?.find((item) => {
      const d = new Date(item.month);
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    })?.total ?? 0;

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const entry = monthlySpending?.find(
      (item) => new Date(item.month).getMonth() === i
    );
    return {
      name: MONTH_NAMES[i],
      amount: entry?.total ?? 0,
    };
  });

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 0);
  const yMax = maxAmount > 0 ? Math.ceil(maxAmount / 2500) * 2500 : 10000;

  return (
    <Card className="w-full h-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Expense Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-[#f1f3f5] p-4">
            <p className="text-sm text-muted-foreground">Total this month</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">
            {/* ${thisMonthTotal.toFixed(2)} */}
              {format(thisMonthTotal)}
            </p>
          </div>
          <div className="rounded-xl bg-[#f1f3f5] p-4">
            <p className="text-sm text-muted-foreground">Total this year</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">
            {/* ${(totalSpent ?? 0).toFixed(2)} */}
              {format(totalSpent ?? 0)}
            </p>
          </div>
        </div>

        <div className="mt-6 w-full h-[280px] sm:h-[320px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                domain={[0, yMax]}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickFormatter={(v) => v.toLocaleString()}
              />
              <Tooltip
              // formatter={(value) => [
              //   `$${Number(value).toFixed(2)}`,
              //   "Spent",
              // ]}
                formatter={(value) => [format(Number(value)), "Spent"]}
              />
              <Bar
                dataKey="amount"
                fill={CHART_COLOR}
                radius={[4, 4, 0, 0]}
                barSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Monthly spending for {currentYear}
        </p>
      </CardContent>
    </Card>
  );
}
