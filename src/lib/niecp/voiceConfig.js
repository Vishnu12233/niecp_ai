// NIA central voice configuration — language-specific recognition codes,
// neural TTS voices, test samples and persisted user settings.

export const VOICE_LANGUAGES = {
  'ta-IN': {
    label: 'Tamil',
    nativeLabel: 'தமிழ்',
    sample: 'வணக்கம்! நான் NIA. உங்கள் business profile-ஐ உருவாக்க நான் உங்களுக்கு வழிகாட்டுகிறேன்.'
  },
  'en-IN': {
    label: 'English',
    nativeLabel: 'English',
    sample: "Hello! I'm NIA. I'll guide you through your business profile."
  },
  'hi-IN': {
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    sample: 'नमस्ते! मैं NIA हूँ। मैं आपके business profile को पूर्ण करने में आपकी मदद करूँगी।'
  },
  'mr-IN': {
    label: 'Marathi',
    nativeLabel: 'मराठी',
    sample: 'नमस्कार! मी NIA आहे. तुमचे business profile पूर्ण करण्यासाठी मी तुम्हाला मार्गदर्शन करेन.'
  }
};

export const DEFAULT_SETTINGS = { language: 'ta-IN', voice: 'female', speed: 0.95 };
export const SPEED_OPTIONS = [0.9, 0.95, 1.0];

export function loadVoiceSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('nia_voice_settings') || 'null');
    if (saved && VOICE_LANGUAGES[saved.language]) {
      return {
        language: saved.language,
        voice: saved.voice === 'male' ? 'male' : 'female',
        speed: SPEED_OPTIONS.includes(Number(saved.speed)) ? Number(saved.speed) : 0.95
      };
    }
  } catch (e) { /* noop */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveVoiceSettings(settings) {
  try {
    localStorage.setItem('nia_voice_settings', JSON.stringify(settings));
  } catch (e) { /* noop */ }
}