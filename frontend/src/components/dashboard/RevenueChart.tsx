"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { RevenueDataPoint } from "@/types";

export default function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1618a3" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#2916a3" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            tickFormatter={(value) => `₦${Number(value) / 1000}k`}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
            labelClassName="text-gray-500"
            contentStyle={{
              borderRadius: 8,
              borderColor: "#e5e7eb",
              boxShadow: "0 4px 12px rgb(15 23 42 / 0.08)",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            // stroke="#16a34a"
            stroke="#2416a3"
            strokeWidth={2}
            fill="url(#revenueFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
