import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useProfile } from "@/lib/niecp/profileContext";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { isDemoUser } from "@/lib/niecp/demoAccount";
import AIAssistant from "@/components/voice/AIAssistant";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FolderKanban, ShieldCheck, FileText, GitBranch,
  MessageSquare, Building2, ChevronDown, Plus, LogOut, Home as HomeIcon, Landmark, Bell, Plug, Factory, SlidersHorizontal
} from "lucide-react";

const NAV = [
  { to: "/", label: "Home", icon: HomeIcon, public: true },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/factors", label: "Regulatory Factors", icon: SlidersHorizontal },
  { to: "/approvals", label: "Approvals", icon: ShieldCheck },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/critical-path", label: "Critical Path", icon: GitBranch },
  { to: "/applications", label: "Applications", icon: FileText },
  { to: "/government", label: "Gov Gateway", icon: Landmark },
  { to: "/integrations", label: "Integrations", icon: Plug },
  { to: "/msme", label: "MSME Intelligence", icon: Factory },
  { to: "/copilot", label: "Copilot", icon: MessageSquare }
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profiles, selected, selectedId, selectProfile, loadProfiles } = useProfile();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  function handleLogout() {
    // AuthContext.logout clears session markers and the stored token,
    // then redirects to the login page. Business data is untouched.
    logout();
  }

  async function createNewProfile() {
    navigate("/onboarding");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[hsl(var(--theme-background-background-1))] text-slate-200 flex flex-col fixed inset-y-0 left-0 z-30 hidden md:flex">
        <div className="px-5 py-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center font-bold text-white">N</div>
            <div>
              <div className="font-bold text-white tracking-tight leading-none">NIECP-AI</div>
              <div className="text-[10px] text-slate-400 leading-none mt-1">Regulatory Intelligence</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = location.pathname === n.to;
            return (
              <Link key={n.to} to={n.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${active ? "bg-white/10 text-white font-medium" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
                <Icon className="w-4 h-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <div className="text-[10px] text-slate-400 px-3 mb-2">DISCLAIMER</div>
          <div className="text-[10px] text-slate-500 px-3 leading-relaxed">
            NIECP-AI provides regulatory intelligence only. It does not issue government approvals.
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="px-4 md:px-8 h-16 flex items-center justify-between gap-4">
            <div className="relative">
              <button onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                <Building2 className="w-4 h-4 text-blue-600" />
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-800 leading-none">{selected ? selected.name : "No profile"}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{selected ? `${selected.state || ""} · ${selected.sub_industry || selected.industry || ""}` : "Select or create"}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {profileOpen && (
                <div className="absolute mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-3 py-1 text-[10px] uppercase text-slate-400 font-semibold">Your profiles</div>
                  {profiles.length === 0 && <div className="px-3 py-2 text-sm text-slate-500">No profiles yet.</div>}
                  {profiles.map((p) => (
                    <button key={p.id} onClick={() => { selectProfile(p.id); setProfileOpen(false); }}
                      className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 ${selectedId === p.id ? "bg-blue-50" : ""}`}>
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-sm font-medium text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-500">{p.industry} · {p.state}</div>
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button onClick={() => { setProfileOpen(false); createNewProfile(); }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-blue-600">
                      <Plus className="w-4 h-4" /> New profile
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-slate-100">
                <Bell className="w-5 h-5 text-slate-500" />
              </button>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-800 flex items-center justify-end gap-1.5">
                  {user?.full_name || "User"}
                  {isDemoUser(user?.email) && (
                    <span className="text-[9px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-200 rounded px-1.5 py-0.5">
                      SIH Demo
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500">{user?.email}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Mobile nav */}
          <div className="md:hidden flex overflow-x-auto px-2 gap-1 border-t border-slate-100">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = location.pathname === n.to;
              return (
                <Link key={n.to} to={n.to}
                  className={`flex items-center gap-1 px-3 py-2 text-xs whitespace-nowrap ${active ? "text-blue-600 font-medium" : "text-slate-500"}`}>
                  <Icon className="w-3.5 h-3.5" /> {n.label}
                </Link>
              );
            })}
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6">
          <Outlet />
        </main>
        <AIAssistant />
      </div>
    </div>
  );
}