"use client";

import Link from "next/link";
import { useCurrency } from "@/components/currency-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

const ACCENT = "#20c997";

export function BalanceSummary({ balances }) {
  const { format } = useCurrency();

  if (!balances) return null;

  const { oweDetails } = balances;
  const hasOwed = oweDetails.youAreOwedBy.length > 0;
  const hasOwing = oweDetails.youOwe.length > 0;

  return (
    <div className="space-y-4">
      {!hasOwed && !hasOwing && (
        <div className="text-center py-6">
          <p className="text-muted-foreground">You&apos;re all settled up!</p>
        </div>
      )}

      {hasOwed && (
        <div>
          <h3 className="text-sm font-medium flex items-center mb-2">
            <ArrowUpCircle className="h-4 w-4 mr-2" style={{ color: ACCENT }} />
            Owed to You
          </h3>
          <div className="space-y-1">
            {oweDetails.youAreOwedBy.map((item) => (
              <Link
                href={`/person/${item.userId}`}
                key={item.userId}
                className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-[#f1f3f5] transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={item.imageUrl} />
                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate">{item.name}</span>
                </div>
                <span
                  className="font-semibold shrink-0 ml-2"
                  style={{ color: ACCENT }}
                >
                  {format(item.amount)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasOwing && (
        <div>
          <h3 className="text-sm font-medium flex items-center mb-2">
            <ArrowDownCircle className="h-4 w-4 text-red-500 mr-2" />
            You owe
          </h3>
          <div className="space-y-1">
            {oweDetails.youOwe.map((item) => (
              <Link
                href={`/person/${item.userId}`}
                key={item.userId}
                className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-[#f1f3f5] transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={item.imageUrl} />
                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate">{item.name}</span>
                </div>
                <span className="font-semibold text-red-600 shrink-0 ml-2">
                  {format(item.amount)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
