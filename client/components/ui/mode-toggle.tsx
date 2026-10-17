"use client"

import { Check, Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useMounted } from "@/hooks/use-mounted"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

type ModeToggleProps = {
  variant?: "outline" | "ghost"
  size?: "icon" | "icon-sm"
  className?: string
}

/**
 * Icon button with a Light / Dark / System menu.
 * The sun/moon swap is CSS-driven so it renders correctly before hydration.
 */
export function ModeToggle({ variant = "ghost", size = "icon-sm", className }: ModeToggleProps) {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={variant}
            size={size}
            className={cn("relative", className)}
            aria-label="Change theme"
          />
        }
      >
        <Sun className="size-4 scale-100 rotate-0 transition-transform duration-300 dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-4 scale-0 rotate-90 transition-transform duration-300 dark:scale-100 dark:rotate-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-36">
        {themeOptions.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
            <Icon />
            {label}
            {theme === value && <Check className="ml-auto size-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Three-way segmented control, used inside the account menu. */
export function ThemeSegmentedControl({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn("grid grid-cols-3 gap-0.5 rounded-lg bg-muted p-0.5", className)}
    >
      {themeOptions.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
              active && "bg-background text-foreground shadow-sm",
            )}
          >
            <Icon className="size-3.5" />
          </button>
        )
      })}
    </div>
  )
}
