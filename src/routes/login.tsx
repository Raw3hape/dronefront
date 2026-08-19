import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { assetUrl } from "@/lib/assets";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-bg px-6 text-fg">
      <img src={assetUrl("/game/maps/front.jpg")} alt="" className="pointer-events-none absolute inset-0 size-full object-cover opacity-35" />
      <div className="absolute inset-0 bg-bg/70" />
      <div className="relative w-full max-w-sm space-y-4 rounded-xl border border-border bg-elevated/90 p-6">
        <p className="font-mono text-2xs tracking-[0.22em] text-muted uppercase">DRONEFRONT</p>
        <h1 className="font-display text-3xl">Sign in</h1>
        <p className="text-sm leading-relaxed text-muted">Optional. Sorties run as a guest either way.</p>
        {authEnabled ? (
          GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => signIn(p.providerId, { callbackURL: "/" })}
            >
              Continue with {p.label}
            </Button>
          ))
        ) : (
          <p className="text-sm text-muted">Sign-in is disabled.</p>
        )}
        <Link to="/" className="block text-center text-sm text-muted hover:text-fg">
          Back to desk
        </Link>
      </div>
    </main>
  );
}
