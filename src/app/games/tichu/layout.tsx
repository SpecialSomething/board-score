import type { Metadata } from "next";
import type { ReactNode } from "react";

import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Tichu",
};

type TichuLayoutProps = {
  children: ReactNode;
};

export default function TichuLayout({
  children,
}: TichuLayoutProps) {
  return (
    <>
      <div className="mx-auto w-full max-w-[393px] px-6 pt-6 font-sans">
        <Header title="Tichu" description="티츄" />
      </div>
  
      {children}
    </>
  );
}