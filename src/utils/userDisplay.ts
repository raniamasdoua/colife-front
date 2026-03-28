export function getInitials(firstName: string, lastName: string): string {
  const a = (firstName?.trim()[0] ?? "").toUpperCase();
  const b = (lastName?.trim()[0] ?? "").toUpperCase();
  return `${a}${b}` || "?";
}
