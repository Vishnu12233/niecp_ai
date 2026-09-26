// Session & "Remember me" helpers.
//
// Base44 stores the auth token in localStorage (persistent across refreshes
// and browser restarts) and handles logout — we never build a second auth
// system here. "Remember me" unchecked emulates a session-scoped login:
// the login survives refreshes and new tabs, but is ended on the next app
// start after the browser was closed (sessionStorage marker is gone).
// No passwords or tokens are ever stored by these helpers.

const REMEMBER_KEY = "niecp_remember";
const ACTIVE_KEY = "niecp_session_active";

export function rememberSession(remember) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
    sessionStorage.setItem(ACTIVE_KEY, "1");
  } catch (e) { /* storage unavailable */ }
}

export function markSessionActive() {
  try {
    sessionStorage.setItem(ACTIVE_KEY, "1");
  } catch (e) { /* storage unavailable */ }
}

export function clearSessionMarkers() {
  try {
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(ACTIVE_KEY);
  } catch (e) { /* storage unavailable */ }
}

// True when a "don't remember me" login should be treated as ended
// (the browser was closed since the login).
export function shouldEndNonRememberedSession() {
  try {
    if (localStorage.getItem(REMEMBER_KEY) !== "false") return false;
    return !sessionStorage.getItem(ACTIVE_KEY);
  } catch (e) {
    return false;
  }
}

// Friendly, non-technical login/auth error messages.
// Never exposes stack traces, internal API errors, tokens or secrets.
export function mapAuthError(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  if (msg.includes("verify")) {
    return "Your account isn't verified yet. Check your email for the verification code.";
  }
  if (msg.includes("invalid email or password") || msg.includes("invalid credentials")) {
    return "Email or password is incorrect.";
  }
  if (msg.includes("not registered")) {
    return "Your account isn't registered for access yet. Please contact the administrator.";
  }
  if (msg.includes("expired")) {
    return "Your session has expired. Please sign in again.";
  }
  if (err && (err.status === undefined || err.status === null)) {
    return "Unable to connect. Please check your internet connection and try again.";
  }
  return "Unable to sign in right now. Please try again.";
}