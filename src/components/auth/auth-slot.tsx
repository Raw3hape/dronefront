import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Link } from "@tanstack/react-router";

export function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div className="size-8 animate-pulse rounded-full bg-surface" />;
  if (user) return <UserButton />;
  return (
    <Link
      to="/login"
      className="inline-flex h-11 items-center rounded-md border border-border px-3 text-xs font-medium text-muted hover:text-fg"
    >
      Sign in
    </Link>
  );
}
