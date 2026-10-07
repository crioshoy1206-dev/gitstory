"use client";

import { useEffect } from "react";
import { SHELL_HTML } from "@/legacy/shell";
import { start } from "@/legacy/gitstory";

export default function Home() {
  useEffect(() => {
    start();
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: SHELL_HTML }} />;
}
