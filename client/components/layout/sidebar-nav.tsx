"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  FolderOpen,
  Images,
  LayoutGrid,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { PixoraLogo } from "@/components/brand/pixora-logo";
import { StorageWidget } from "@/components/library/storage-widget";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/* Only routes that exist and are backed by the API. */
const navGroups: { heading: string | null; items: NavItem[] }[] = [
  {
    heading: null,
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutGrid },
      { href: "/photos", label: "Photos", icon: Images },
      { href: "/albums", label: "Albums", icon: FolderOpen },
    ],
  },
  {
    heading: "Manage",
    items: [
      { href: "/archive", label: "Archive", icon: Archive },
      { href: "/trash", label: "Trash", icon: Trash2 },
    ],
  },
];

type SidebarNavProps = {
  onNavigate?: () => void;
};

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <PixoraLogo />
        </Link>
      </div>

      <nav aria-label="Workspace" className="flex flex-1 flex-col gap-5 px-3 pt-1">
        {navGroups.map((group) => (
          <div key={group.heading ?? "primary"}>
            {group.heading && (
              <p className="mb-1.5 px-3 text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
                {group.heading}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground",
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <StorageWidget />
      </div>
    </div>
  );
}
