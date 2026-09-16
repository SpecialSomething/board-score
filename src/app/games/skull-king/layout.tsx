import type { Metadata } from "next";
import type { ReactNode } from "react";

import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Skull King",
};

type SkullKingLayoutProps = {
  children: ReactNode;
};

export default function SkullKingLayout({
  children,
}: SkullKingLayoutProps) {
  return (
    <>
      <div className="mx-auto w-full max-w-[393px] px-6 pt-6 font-sans">
        <Header title="Skull King" description="스컬킹" />
      </div>

      {children}
    </>
  );
}