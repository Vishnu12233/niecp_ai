import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, Rocket } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";
import { rememberSession, mapAuthError } from "@/lib/authSession";
import { DEMO_ACCOUNT } from "@/lib/niecp/demoAccount";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  // Post-login destination (e.g. the MCP OAuth consent page sends users here
  // with returnTo so the grant flow can resume). Same-origin paths only.
  const returnTo = safeReturnTo();

  // Shared login path for normal and demo sign-in — always the real
  // authentication flow (no bypass, no fake frontend-only login).
  const doLogin = async (loginEmail, loginPassword, dest, setBusy) => {
    setError("");
    setBusy(true);
    try {
      await base44.auth.loginViaEmailPassword(loginEmail, loginPassword);
      rememberSession(remember);
      window.location.href = dest;
    } catch (err) {
      setError(mapAuthError(err));
      setBusy(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doLogin(email, password, returnTo, setLoading);
  };

  const handleDemoLogin = () => {
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.password);
    doLogin(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password, "/dashboard", setDemoLoading);
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", returnTo);
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="remember" className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(v) => setRemember(v === true)}
            />
            Remember me
          </label>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading || demoLoading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      {/* SIH 2026 demo account — real credentials, real login flow */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-800">SIH 2026 Demo</span>
          <span className="text-[9px] uppercase font-bold tracking-wide text-blue-600 bg-blue-100 rounded px-1.5 py-0.5">
            Demo credentials
          </span>
        </div>
        <p className="text-xs text-slate-600 mb-3">
          Experience NIECP-AI with a ready-to-use industrial project — no signup needed.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 min-w-0">
            <div className="text-[9px] uppercase text-slate-400 font-semibold">Demo email</div>
            <div className="font-mono text-slate-700 truncate">{DEMO_ACCOUNT.email}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 min-w-0">
            <div className="text-[9px] uppercase text-slate-400 font-semibold">Demo password</div>
            <div className="font-mono text-slate-700 truncate">{DEMO_ACCOUNT.password}</div>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full h-10 text-sm border-blue-200 text-blue-700 hover:bg-blue-100"
          disabled={demoLoading || loading}
          onClick={handleDemoLogin}
        >
          {demoLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            "🚀 Try Demo Account"
          )}
        </Button>
      </div>
    </AuthLayout>
  );
}