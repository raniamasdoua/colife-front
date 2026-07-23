export const FORM_LABEL_CLASS = "block text-xs font-semibold text-gray-600 mb-1.5";

export const MAX_TITLE = 200;
export const MAX_DESCRIPTION = 5000;
export const MAX_STREET = 255;
export const MAX_COMPLEMENT = 255;
export const MAX_CITY = 120;
export const MAX_ROOM = 255;

export function todayIso(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function toBackendTime(value: string): string {
  if (!value) return value;
  const parts = value.split(":");
  if (parts.length >= 2) {
    const h = parts[0].padStart(2, "0");
    const min = parts[1].padStart(2, "0");
    const sec = (parts[2] ?? "0").padStart(2, "0");
    return `${h}:${min}:${sec}`;
  }
  return value;
}
