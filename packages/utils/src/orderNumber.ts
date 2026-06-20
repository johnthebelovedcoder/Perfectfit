export function formatOrderNumber(raw: string): string {
  return `TH-${raw.slice(-8).toUpperCase()}`;
}

export function generateGuestToken(): string {
  return crypto.randomUUID();
}
