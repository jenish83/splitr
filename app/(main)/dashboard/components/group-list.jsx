"use client";

import Link from "next/link";
import { useCurrency } from "@/components/currency-provider";
import { Users } from "lucide-react";

const ACCENT = "#20c997";

export function GroupList({ groups }) {
  const { format } = useCurrency();

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No groups yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a group to start tracking shared expenses
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {groups.map((group) => {
        const balance = group.balance ?? 0;

        return (
          <Link
            href={`/groups/${group.id}`}
            key={group.id}
            className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-[#f1f3f5] transition-colors gap-2"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e9ecef]">
                <Users className="h-5 w-5 text-[#6c757d]" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{group.name}</p>
                <p className="text-xs text-muted-foreground">
                  {group.members.length} members
                </p>
              </div>
            </div>
            <span
              className={`text-sm font-semibold shrink-0 ${
                balance >= 0 ? "" : "text-red-600"
              }`}
              style={balance >= 0 ? { color: ACCENT } : undefined}
            >
              {format(balance, { signed: true })}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
