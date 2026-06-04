"use client";

import { Authenticated } from "convex/react";
import React from "react";
import { CurrencyProvider } from "@/components/currency-provider";

const MainLayout = ({ children }) => {
  return (
    <Authenticated>
      <CurrencyProvider>
        <div className="w-full mx-auto mt-24 mb-20 px-4 sm:px-6 lg:px-8 max-w-[min(100rem,calc(100vw-3rem))]">
          {children}
        </div>
      </CurrencyProvider>
    </Authenticated>
  );
};

export default MainLayout;
