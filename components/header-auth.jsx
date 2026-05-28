"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useStoreUser } from "@/hooks/use-store-hooks";
import { BarLoader } from "react-spinners";
import Image from "next/image";
import Link from "next/link";

export function HeaderAuth() {
  const { isLoading, isAuthenticated } = useStoreUser();
  return (
    <header className="fixed top-0 w-full border-b bg-white/95 backdrop-blur z-50 supports-backdrop-filter:bg-white/60">
      <nav className="container mx-auto h-16 flex items-center justify-between"> 
        <Link href="/" className="flex items-center gap-2">
          <Image 
          src="/logos/logo.png" 
          alt="logo" 
          width={200} 
          height={60}
          className="h-11 w-auto object-contain" />
        </Link>
      </nav>

      {isLoading && <BarLoader width={"100%"} color="#36d7b7" />}
    </header>
  );
}
