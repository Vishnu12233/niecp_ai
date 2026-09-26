import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { isDemoUser, ensureDemoProject } from "@/lib/niecp/demoAccount";

// Guard so the demo project is only ever auto-created once per app session.
let demoSeedTried = false;

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfiles() {
    setLoading(true);
    try {
      let list = await base44.entities.BusinessProfile.list("-updated_date", 50);
      // First login of the SIH demo account: auto-create the demo project so
      // judges land on a fully populated dashboard. It is created by the
      // demo user themselves, so RLS keeps it isolated from other accounts.
      if (list.length === 0 && isDemoUser(user?.email) && !demoSeedTried) {
        demoSeedTried = true;
        try {
          await ensureDemoProject();
          list = await base44.entities.BusinessProfile.list("-updated_date", 50);
        } catch (e) {
          console.error("Demo project seeding failed:", e);
        }
      }
      setProfiles(list);
      const saved = localStorage.getItem("niecp_selected_profile");
      const exists = list.find((p) => p.id === saved);
      setSelectedId(exists ? saved : list[0]?.id || null);
    } catch (e) {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfiles(); }, []);

  const selected = profiles.find((p) => p.id === selectedId) || null;

  function selectProfile(id) {
    setSelectedId(id);
    if (id) localStorage.setItem("niecp_selected_profile", id);
  }

  async function refreshProfile() {
    if (!selectedId) return;
    try {
      const updated = await base44.entities.BusinessProfile.get(selectedId);
      setProfiles((prev) => prev.map((p) => (p.id === selectedId ? updated : p)));
    } catch (e) {}
  }

  return (
    <ProfileContext.Provider value={{ profiles, selected, selectedId, selectProfile, loadProfiles, refreshProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

// Safe empty context: guarantees consumers can always destructure, even during
// a hot-reload where the provider module and a consumer briefly disagree about
// the context instance. Behaviour is identical whenever the provider is mounted.
const EMPTY_PROFILE_CONTEXT = {
  profiles: [],
  selected: null,
  selectedId: null,
  selectProfile: () => {},
  loadProfiles: async () => {},
  refreshProfile: async () => {},
  loading: true
};

export function useProfile() {
  return useContext(ProfileContext) || EMPTY_PROFILE_CONTEXT;
}