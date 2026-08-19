const PREFIX = import.meta.env.VERCEL
  ? "https://raw.githubusercontent.com/Raw3hape/dronefront/main/public"
  : "";

export function assetUrl(path: string): string {
  return `${PREFIX}${path}`;
}
