"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              © 2025 RANKORA AI. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Powered by</span>
            <Link
              href="https://huminarylabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <img
                src="/logo_huminarylabs.png"
                alt="Huminary Labs"
                className="h-6 w-auto"
              />
              <span className="text-sm font-medium">Huminary Labs</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}