import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useApp } from "@/components/app-provider"

export function ThemeButton() {
  const { theme, setTheme } = useApp()
  const next = theme === "dark" ? "light" : "dark"
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`Use ${next} theme`}
      title={`Use ${next} theme`}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  )
}
