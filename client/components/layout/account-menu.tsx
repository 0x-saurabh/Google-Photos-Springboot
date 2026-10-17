"use client";

import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSegmentedControl } from "@/components/ui/mode-toggle";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { getInitials } from "@/lib/initials";

export function AccountMenu() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="rounded-full outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring/60 data-popup-open:ring-2 data-popup-open:ring-ring/40"
      >
        <Avatar className="size-8 border border-border">
          <AvatarFallback className="bg-accent text-xs font-medium text-accent-foreground">
            {getInitials(user?.displayName ?? user?.email)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-0">
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar className="size-9 border border-border">
            <AvatarFallback className="bg-accent text-sm font-medium text-accent-foreground">
              {getInitials(user?.displayName ?? user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{user?.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <DropdownMenuSeparator className="my-0" />

        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <span className="text-sm text-foreground">Theme</span>
          <ThemeSegmentedControl className="w-28" />
        </div>

        <DropdownMenuSeparator className="my-0" />

        <DropdownMenuGroup className="p-1">
          <DropdownMenuItem
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="px-2 py-1.5"
          >
            {logout.isPending ? <Spinner className="size-4" /> : <LogOut />}
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
