"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useCurrency } from "@/components/currency-provider";

const formatAmount = (value) => (Number(value) || 0).toFixed(2);
const formatPercent = (value) => (Number(value) || 0).toFixed(1);

const sliderValue = (value) =>
  Array.isArray(value) ? (value[0] ?? 0) : (Number(value) || 0);

export function SplitSelector({
  type,
  amount,
  participants,
  paidByUserId,
  onSplitsChange,
}) {
  const { format, symbol } = useCurrency();
  const { user } = useUser();
  const numericAmount = Number(amount) || 0;
  const [splits, setSplits] = useState([]);
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const splitsRef = useRef(splits);
  splitsRef.current = splits;

  const participantKey = participants.map((p) => p.id).join(",");

  const commitSplits = (newSplits) => {
    setSplits(newSplits);
    const newTotalAmount = newSplits.reduce((sum, split) => sum + split.amount, 0);
    const newTotalPercentage = newSplits.reduce(
      (sum, split) => sum + split.percentage,
      0
    );
    setTotalAmount(newTotalAmount);
    setTotalPercentage(newTotalPercentage);
    onSplitsChange?.(newSplits);
  };

  const buildSplitsFromInputs = (prev) => {
    const prevByUser = new Map(prev.map((s) => [s.userId, s]));
    const evenShare = 100 / participants.length;

    if (type === "percentage" && prev.length === participants.length) {
      return participants.map((participant) => {
        const existing = prevByUser.get(participant.id);
        const percentage = existing?.percentage ?? evenShare;
        return {
          userId: participant.id,
          name: participant.name,
          email: participant.email,
          imageUrl: participant.imageUrl,
          amount: (numericAmount * percentage) / 100,
          percentage,
          paid: participant.id === paidByUserId,
        };
      });
    }

    if (type === "exact" && prev.length === participants.length) {
      return participants.map((participant) => {
        const existing = prevByUser.get(participant.id);
        const splitAmount =
          existing?.amount ?? numericAmount / participants.length;
        return {
          userId: participant.id,
          name: participant.name,
          email: participant.email,
          imageUrl: participant.imageUrl,
          amount: splitAmount,
          percentage:
            numericAmount > 0 ? (splitAmount / numericAmount) * 100 : 0,
          paid: participant.id === paidByUserId,
        };
      });
    }

    if (type === "equal") {
      const shareAmount = numericAmount / participants.length;
      return participants.map((participant) => ({
        userId: participant.id,
        name: participant.name,
        email: participant.email,
        imageUrl: participant.imageUrl,
        amount: shareAmount,
        percentage: evenShare,
        paid: participant.id === paidByUserId,
      }));
    }

    if (type === "percentage") {
      return participants.map((participant) => ({
        userId: participant.id,
        name: participant.name,
        email: participant.email,
        imageUrl: participant.imageUrl,
        amount: (numericAmount * evenShare) / 100,
        percentage: evenShare,
        paid: participant.id === paidByUserId,
      }));
    }

    const evenAmount = numericAmount / participants.length;
    return participants.map((participant) => ({
      userId: participant.id,
      name: participant.name,
      email: participant.email,
      imageUrl: participant.imageUrl,
      amount: evenAmount,
      percentage: (evenAmount / numericAmount) * 100,
      paid: participant.id === paidByUserId,
    }));
  };

  // Recalculate splits when inputs change (not on each slider drag)
  useEffect(() => {
    if (numericAmount <= 0 || participants.length === 0) {
      commitSplits([]);
      return;
    }

    commitSplits(buildSplitsFromInputs(splitsRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- buildSplitsFromInputs uses latest props
  }, [type, numericAmount, participantKey, paidByUserId, onSplitsChange, participants]);

  const updatePercentageSplit = (userId, newPercentage) => {
    const pct = Math.max(0, Math.min(100, Number(newPercentage) || 0));

    const updatedSplits = splits.map((split) => {
      if (split.userId === userId) {
        return {
          ...split,
          percentage: pct,
          amount: (numericAmount * pct) / 100,
        };
      }
      return split;
    });

    commitSplits(updatedSplits);
  };

  const updateExactSplit = (userId, newAmount) => {
    const parsedAmount = parseFloat(newAmount) || 0;

    const updatedSplits = splits.map((split) => {
      if (split.userId === userId) {
        return {
          ...split,
          amount: parsedAmount,
          percentage:
            numericAmount > 0 ? (parsedAmount / numericAmount) * 100 : 0,
        };
      }
      return split;
    });

    commitSplits(updatedSplits);
  };

  const isPercentageValid = Math.abs(totalPercentage - 100) < 0.01;
  const isAmountValid = Math.abs(totalAmount - numericAmount) < 0.01;
  const canShowSplits =
    numericAmount > 0 &&
    participants.length > 0 &&
    splits.length === participants.length;

  return (
    <div className="space-y-4 mt-4">
      {canShowSplits &&
        splits.map((split) => (
          <div
            key={split.userId}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2 min-w-[120px]">
              <Avatar className="h-7 w-7">
                <AvatarImage src={split.imageUrl} />
                <AvatarFallback>
                  {split.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                {split.userId === user?.id ? "You" : split.name}
              </span>
            </div>

            {type === "equal" && (
              <div className="text-right text-sm">
                {format(split.amount)} ({formatPercent(split.percentage)}
                %)
              </div>
            )}

            {type === "percentage" && (
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <Slider
                  value={Number(split.percentage) || 0}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) =>
                    updatePercentageSplit(split.userId, sliderValue(value))
                  }
                  className="min-w-[120px] flex-1"
                />
                <div className="flex gap-1 items-center min-w-[100px]">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formatPercent(split.percentage)}
                    onChange={(e) =>
                      updatePercentageSplit(
                        split.userId,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-16 h-8"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  <span className="text-sm ml-1">
                    {format(split.amount)}
                  </span>
                </div>
              </div>
            )}

            {type === "exact" && (
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1"></div>
                <div className="flex gap-1 items-center">
                  <span className="text-sm text-muted-foreground">{symbol}</span>
                  <Input
                    type="number"
                    min="0"
                    max={numericAmount * 2}
                    step="0.01"
                    value={formatAmount(split.amount)}
                    onChange={(e) =>
                      updateExactSplit(split.userId, e.target.value)
                    }
                    className="w-24 h-8"
                  />
                  <span className="text-sm text-muted-foreground ml-1">
                    ({formatPercent(split.percentage)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}

      {canShowSplits && (
        <div className="flex justify-between border-t pt-3 mt-3">
          <span className="font-medium">Total</span>
          <div className="text-right">
            <span
              className={`font-medium ${!isAmountValid ? "text-amber-600" : ""}`}
            >
              {format(totalAmount)}
            </span>
            {type !== "equal" && (
              <span
                className={`text-sm ml-2 ${!isPercentageValid ? "text-amber-600" : ""}`}
              >
                ({formatPercent(totalPercentage)}%)
              </span>
            )}
          </div>
        </div>
      )}

      {canShowSplits && type === "percentage" && !isPercentageValid && (
        <div className="text-sm text-amber-600 mt-2">
          The percentages should add up to 100%.
        </div>
      )}

      {canShowSplits && type === "exact" && !isAmountValid && (
        <div className="text-sm text-amber-600 mt-2">
          The sum of all splits ({format(totalAmount)}) should equal the total
          amount ({format(numericAmount)}).
        </div>
      )}
    </div>
  );
}
