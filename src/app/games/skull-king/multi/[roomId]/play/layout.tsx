import type { ReactNode } from "react";

import Header from "@/components/Header";

type Props = {
  children: ReactNode;
};

export default function Layout({
  children,
}: Props) {
  return (
    <>
      <div className="mx-auto w-full max-w-md px-4 pt-6">
        <Header />
      </div>

      {children}
    </>
  );
}