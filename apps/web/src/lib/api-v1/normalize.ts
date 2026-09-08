export function normalizeName(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US")
}
