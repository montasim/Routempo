import type { Routine } from "@/lib/types"

export const defaultCategories: string[] = []

export function categoryList(
  categories: string[] | undefined,
  routines: Routine[]
) {
  return [
    ...(categories ?? defaultCategories),
    ...routines.map((routine) => routine.category),
  ].reduce<string[]>((list, category) => {
    const name = category.trim()
    if (name && !list.some((item) => categoryMatches(item, name)))
      list.push(name)
    return list
  }, [])
}

export function categoryMatches(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0
}
