import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Skull King",
};

type SkullKingLayoutProps = {
  children: ReactNode;
};

export default function SkullKingLayout({
  children,
}: SkullKingLayoutProps) {
  return children;
}