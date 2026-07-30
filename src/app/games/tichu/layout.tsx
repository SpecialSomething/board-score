import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tichu",
};

type TichuLayoutProps = {
  children: ReactNode;
};

export default function TichuLayout({
  children,
}: TichuLayoutProps) {
  return children;
}