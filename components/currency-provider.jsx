"use client";

import { createContext,useCallback,useContext,useMemo,useState } from "react";
import { DEFAULT_CURRENCY,formatMoney,getCurrencyMeta,getStorageKey,isValidCurrency } from "@/lib/currencies";

const CurrencyContext = createContext(null);

function readStoredCurrency() {
  if (typeof window === "undefined") return DEFAULT_CURRENCY;
  try {
    const stored = localStorage.getItem(getStorageKey());
    if (isValidCurrency(stored)) return stored;
  } catch {
    console.error("Error reading stored currency:", error);
  }
  return DEFAULT_CURRENCY;
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(readStoredCurrency);

  const setCurrency = useCallback((code) => {
    if (!isValidCurrency(code)) return;
    setCurrencyState(code);
    try {
      localStorage.setItem(getStorageKey(), code);
    } catch {
      console.error("Error setting stored currency:", error);
    }
  }, []);

  const format = useCallback(
    (amount, options) => formatMoney(amount, currency, options),
    [currency]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      format,
      symbol: getCurrencyMeta(currency).symbol,
    }),
    [currency, setCurrency, format]
  );

  return (
    <CurrencyContext.Provider value={value}>
        {children}
        </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
