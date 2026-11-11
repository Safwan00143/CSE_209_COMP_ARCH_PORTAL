"use client"

import Link from "next/link"
import { TabBar } from "glisse"
import { useRoute } from "@/lib/use-route"
import { ThemeToggle } from "./theme-toggle"

const nav = [
  { value: "/learn", href: "/learn", label: "Learn" },
  { value: "/practice", href: "/practice", label: "Practice" },
  { value: "/papers", href: "/papers", label: "Papers" },
  { value: "/slides", href: "/slides", label: "Slides" },
]
export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      {/* The site mark (favicon design B4): the notched ALU from the datapath figures. */}
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="7.5" fill="#e8b23a" />
        <path d="M8 6 L25 12 V20 L8 26 V18.5 L11.5 16 L8 13.5 Z" fill="#2a1f0a" />
        <circle cx="20" cy="16" r="2.2" fill="#ffffff" />
      </svg>
      <span className="hidden whitespace-nowrap font-heading text-[15px] font-medium tracking-tight sm:inline">
        Computer Architecture
      </span>
      <span className="whitespace-nowrap font-heading text-[15px] font-medium tracking-tight max-[419px]:hidden sm:hidden">CSE 209</span>
    </span>
  )
}

export function SiteHeader() {
  const pathname = useRoute()
  const active = nav.find((item) => pathname.startsWith(item.href))?.value ?? null
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="Home" className="shrink-0">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-2" aria-label="Sections">
          {/* Liquid Glass tab bar: the selection slides between sections and follows a drag. */}
          <TabBar aria-label="Sections" className="site-tabs" items={nav} value={active} link={Link} />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
