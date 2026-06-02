"use client";

import { Authenticated } from "convex/react";
import React from "react";

const MainLayout = ({ children }) => {
  return (
    <Authenticated>
      <div className="w-full mx-auto mt-24 mb-20 px-4 sm:px-6 lg:px-8 max-w-[min(100rem,calc(100vw-3rem))]">
        {children}
      </div>
    </Authenticated>
  );
};

export default MainLayout;
