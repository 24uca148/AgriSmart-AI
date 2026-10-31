import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

export type Language = "en" | "ta";

const STORAGE_KEY = "agrismart-language";
const DEFAULT_LANGUAGE: Language = "en"; // English is the default; Tamil is opt-in.

// Flat key -> { en, ta } dictionary covering every page. Add new keys here
// as new UI text is introduced.
const translations = {
  // --- Shared / brand ---
  appName: { en: "AgriSmart AI", ta: "AgriSmart AI" },
  tagline: { en: "Farmer Advisory System", ta: "விவசாயி ஆலோசனை அமைப்பு" },
  hi: { en: "Hi,", ta: "வணக்கம்," },
  logOut: { en: "Log out", ta: "வெளியேறு" },
  adminPanelNav: { en: "Admin panel", ta: "நிர்வாக பலகம்" },

  // --- Login page ---
  welcomeBack: { en: "Welcome back", ta: "மீண்டும் வரவேற்கிறோம்" },
  adminSignInTitle: { en: "Administrator sign in", ta: "நிர்வாகி உள்நுழைவு" },
  adminSignInLabel: { en: "Admin Sign-In", ta: "நிர்வாகி உள்நுழைவு" },
  adminSignInSubtitle: {
    en: "Sign in with an administrator account to manage users.",
    ta: "பயனர்களை நிர்வகிக்க நிர்வாகி கணக்குடன் உள்நுழையவும்.",
  },
  loginSubtitle: {
    en: "Log in to access your farm advisory dashboard.",
    ta: "உங்கள் பண்ணை ஆலோசனை டாஷ்போர்டை அணுக உள்நுழையவும்.",
  },
  usernameOrEmail: { en: "Username or email", ta: "பயனர்பெயர் அல்லது மின்னஞ்சல்" },
  password: { en: "Password", ta: "கடவுச்சொல்" },
  signIn: { en: "Sign In", ta: "உள்நுழைக" },
  signInAsAdmin: { en: "Sign In as Administrator", ta: "நிர்வாகியாக உள்நுழைக" },
  dontHaveAccount: { en: "Don't have an account?", ta: "கணக்கு இல்லையா?" },
  registerLink: { en: "Register", ta: "பதிவு செய்க" },
  farmerSignInHere: { en: "Farmer? Sign in here", ta: "விவசாயியா? இங்கே உள்நுழையவும்" },
  adminSignInHere: { en: "Administrator? Sign in here", ta: "நிர்வாகியா? இங்கே உள்நுழையவும்" },
  captchaMismatch: {
    en: "That code doesn't match. Please try again.",
    ta: "குறியீடு பொருந்தவில்லை. மீண்டும் முயற்சிக்கவும்.",
  },
  loginFailed: { en: "Login failed", ta: "உள்நுழைவு தோல்வியடைந்தது" },
  showPassword: { en: "Show password", ta: "கடவுச்சொல்லைக் காட்டு" },
  hidePassword: { en: "Hide password", ta: "கடவுச்சொல்லை மறை" },

  // --- Register page ---
  createAccountTitle: { en: "Create your account", ta: "உங்கள் கணக்கை உருவாக்கவும்" },
  registerSubtitle: {
    en: "Register to get personalized crop and yield advisories.",
    ta: "தனிப்பயனாக்கப்பட்ட பயிர் மற்றும் விளைச்சல் ஆலோசனைகளைப் பெற பதிவு செய்யவும்.",
  },
  fullName: { en: "Full name", ta: "முழு பெயர்" },
  username: { en: "Username", ta: "பயனர்பெயர்" },
  email: { en: "Email", ta: "மின்னஞ்சல்" },
  mobileNumber: { en: "Mobile number", ta: "மொபைல் எண்" },
  confirmPassword: { en: "Confirm password", ta: "கடவுச்சொல்லை உறுதிப்படுத்தவும்" },
  passwordHint: { en: "At least 5 characters.", ta: "குறைந்தது 5 எழுத்துகள்." },
  createAccount: { en: "Create Account", ta: "கணக்கை உருவாக்கு" },
  alreadyHaveAccount: { en: "Already have an account?", ta: "ஏற்கனவே கணக்கு உள்ளதா?" },
  signInLink: { en: "Sign in", ta: "உள்நுழைக" },
  registrationFailed: { en: "Registration failed", ta: "பதிவு தோல்வியடைந்தது" },

  // --- Captcha ---
  securityCode: { en: "Security code", ta: "பாதுகாப்பு குறியீடு" },
  enterCode: { en: "Enter code", ta: "குறியீட்டை உள்ளிடவும்" },
  refreshCode: { en: "Refresh security code", ta: "பாதுகாப்பு குறியீட்டைப் புதுப்பிக்கவும்" },

  // --- Dashboard ---
  regenerateModelData: { en: "Regenerate Model Data", ta: "மாதிரி தரவை மீண்டும் உருவாக்கு" },
  trainingModels: { en: "Training Models...", ta: "மாதிரிகள் பயிற்சி பெறுகின்றன..." },
  newAnalysis: { en: "New Analysis", ta: "புதிய பகுப்பாய்வு" },
  newAnalysisSubtitle: {
    en: "Enter current field metrics to generate recommendations.",
    ta: "பரிந்துரைகளை உருவாக்க தற்போதைய வயல் அளவீடுகளை உள்ளிடவும்.",
  },
  fieldIntelligenceOverview: { en: "Field Intelligence Overview", ta: "வயல் நுண்ணறிவு மேலோட்டம்" },
  fieldOverviewSubtitle: {
    en: "Latest AI-driven insights based on your environmental data.",
    ta: "உங்கள் சுற்றுச்சூழல் தரவின் அடிப்படையில் சமீபத்திய AI நுண்ணறிவுகள்.",
  },
  loadingAdvisory: { en: "Loading advisory data...", ta: "ஆலோசனை தரவு ஏற்றப்படுகிறது..." },
  noAnalysesYet: { en: "No analyses yet", ta: "இதுவரை பகுப்பாய்வுகள் இல்லை" },
  noAnalysesDesc: {
    en: "Use the form on the left to input your soil and weather data, or click 'Regenerate Model Data' to generate a synthetic dataset.",
    ta: "உங்கள் மண் மற்றும் வானிலை தரவை உள்ளிட இடதுபுறத்தில் உள்ள படிவத்தைப் பயன்படுத்தவும், அல்லது செயற்கை தரவுத்தொகுப்பை உருவாக்க 'மாதிரி தரவை மீண்டும் உருவாக்கு' என்பதைக் கிளிக் செய்யவும்.",
  },

  // --- Field Intelligence Overview: Download Report ---
  downloadReport: { en: "Download Report", ta: "அறிக்கையைப் பதிவிறக்கு" },
  generatingReport: { en: "Generating...", ta: "உருவாக்கப்படுகிறது..." },
  reportDownloaded: { en: "Report downloaded", ta: "அறிக்கை பதிவிறக்கப்பட்டது" },
  reportDownloadedDesc: {
    en: "Your Field Intelligence Report has been saved as a PDF.",
    ta: "உங்கள் வயல் நுண்ணறிவு அறிக்கை PDF ஆக சேமிக்கப்பட்டது.",
  },
  reportDownloadFailed: { en: "Download failed", ta: "பதிவிறக்கம் தோல்வியடைந்தது" },
  reportDownloadFailedDesc: {
    en: "We couldn't generate the report. Please try again.",
    ta: "அறிக்கையை உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
  },

  // --- Prediction form ---
  soilProfile: { en: "Soil Profile", ta: "மண் விவரம்" },
  nitrogen: { en: "Soil Nitrogen (N) (mg/kg)", ta: "மண் நைட்ரஜன் (N) (mg/kg)" },
  phosphorus: { en: "Soil Phosphorus (P) (mg/kg)", ta: "மண் பாஸ்பரஸ் (P) (mg/kg)" },
  potassium: { en: "Soil Potassium (K) (mg/kg)", ta: "மண் பொட்டாசியம் (K) (mg/kg)" },
  phLevel: { en: "pH Level", ta: "pH அளவு" },
  climateData: { en: "Climate Data", ta: "காலநிலை தரவு" },
  temperature: { en: "Temperature (°C)", ta: "வெப்பநிலை (°C)" },
  humidity: { en: "Humidity (%)", ta: "ஈரப்பதம் (%)" },
  rainfall: { en: "Rainfall (mm)", ta: "மழைப்பொழிவு (mm)" },
  historicalPests: { en: "Historical Pests", ta: "முந்தைய பூச்சி தாக்குதல்கள்" },
  pestSeverity: { en: "Pest Severity (0-10)", ta: "பூச்சி தீவிரம் (0-10)" },
  none0: { en: "None (0)", ta: "இல்லை (0)" },
  severe10: { en: "Severe (10)", ta: "கடுமையானது (10)" },
  pestLevelNone: { en: "None", ta: "இல்லை" },
  pestLevelLow: { en: "Low", ta: "குறைவு" },
  pestLevelMedium: { en: "Medium", ta: "நடுத்தரம்" },
  pestLevelHigh: { en: "High", ta: "அதிகம்" },
  runAiAnalysis: { en: "Run AI Analysis", ta: "AI பகுப்பாய்வை இயக்கு" },
  analyzingData: { en: "Analyzing Data...", ta: "தரவு பகுப்பாய்வு செய்யப்படுகிறது..." },

  // --- Soil test report upload ---
  soilTestReport: { en: "Soil Test Report", ta: "மண் பரிசோதனை அறிக்கை" },
  uploadSoilReportPhoto: { en: "Upload Soil Report Photo", ta: "மண் அறிக்கை புகைப்படத்தைப் பதிவேற்றவும்" },
  changePhoto: { en: "Change photo", ta: "புகைப்படத்தை மாற்று" },
  uploadingReport: { en: "Uploading...", ta: "பதிவேற்றப்படுகிறது..." },
  reportUploaded: { en: "Soil report uploaded", ta: "மண் அறிக்கை பதிவேற்றப்பட்டது" },
  soilReportHint: {
    en: "JPEG, PNG or WEBP, up to 5 MB.",
    ta: "JPEG, PNG அல்லது WEBP, 5 MB வரை.",
  },
  invalidImageFile: { en: "Please choose an image file.", ta: "தயவுசெய்து ஒரு படக் கோப்பைத் தேர்ந்தெடுக்கவும்." },
  imageTooLarge: { en: "Image is too large. Please choose a smaller file.", ta: "படம் மிகப் பெரியது. சிறிய கோப்பைத் தேர்ந்தெடுக்கவும்." },

  // --- Metric cards ---
  recommendedCrop: { en: "Recommended Crop", ta: "பயிர் பரிந்துரை" },
  estYield: { en: "Est. Yield", ta: "மதிப்பிடப்பட்ட விளைச்சல்" },
  pestRiskLevel: { en: "Pest Risk Level", ta: "பூச்சி அபாய நிலை" },
  irrigation: { en: "Irrigation", ta: "நீர்ப்பாசனம்" },
  unitTonsPerHectare: { en: "t/ha", ta: "டன்/ஹெக்டேர்" },

  // --- Charts ---
  yieldTrend: { en: "Yield Prediction Trend", ta: "விளைச்சல் முன்கணிப்பு போக்கு" },
  yieldTrendSub: {
    en: "Historical estimates across recent analyses (t/ha)",
    ta: "சமீபத்திய பகுப்பாய்வுகளில் வரலாற்று மதிப்பீடுகள் (டன்/ஹெக்.)",
  },
  pestRiskDistribution: { en: "Pest Risk Distribution", ta: "பூச்சி ஆபத்து விநியோகம்" },
  pestRiskDistSub: { en: "Overall historical risk levels", ta: "ஒட்டுமொத்த வரலாற்று ஆபத்து நிலைகள்" },

  // --- Admin ---
  adminPanelTitle: { en: "Admin Panel", ta: "நிர்வாக பலகம்" },
  adminLabel: { en: "Admin", ta: "நிர்வாகி" },
  registeredUsers: { en: "Registered users", ta: "பதிவு செய்யப்பட்ட பயனர்கள்" },
  registeredUsersSub: {
    en: "Everyone who has created an account on AgriSmart AI.",
    ta: "AgriSmart AI-இல் கணக்கை உருவாக்கிய அனைவரும்.",
  },
  dashboard: { en: "Dashboard", ta: "டாஷ்போர்டு" },
  loadingUsers: { en: "Loading users…", ta: "பயனர்கள் ஏற்றப்படுகிறார்கள்…" },
  couldntLoadUsers: { en: "Couldn't load users", ta: "பயனர்களை ஏற்ற முடியவில்லை" },
  somethingWrong: { en: "Something went wrong.", ta: "ஏதோ தவறு ஏற்பட்டது." },
  noUsersYet: { en: "No users yet.", ta: "இதுவரை பயனர்கள் இல்லை." },
  fullNameCol: { en: "Full name", ta: "முழு பெயர்" },
  usernameCol: { en: "Username", ta: "பயனர்பெயர்" },
  emailCol: { en: "Email", ta: "மின்னஞ்சல்" },
  mobileCol: { en: "Mobile", ta: "மொபைல்" },
  roleCol: { en: "Role", ta: "பங்கு" },
  statusCol: { en: "Status", ta: "நிலை" },
  joinedCol: { en: "Joined", ta: "சேர்ந்த நாள்" },
  lastLoginCol: { en: "Last login", ta: "கடைசி உள்நுழைவு" },
  soilReportCol: { en: "Soil Report", ta: "மண் அறிக்கை" },
  viewReport: { en: "View Report", ta: "அறிக்கையைக் காண்க" },
  noReport: { en: "No report", ta: "அறிக்கை இல்லை" },
  farmerBadge: { en: "Farmer", ta: "விவசாயி" },
  onlineBadge: { en: "Online", ta: "இணைப்பில்" },
  offlineBadge: { en: "Offline", ta: "இணைப்பில் இல்லை" },
  never: { en: "Never", ta: "ஒருபோதும் இல்லை" },

  // --- Language switcher ---
  language: { en: "Language", ta: "மொழி" },
} satisfies Record<string, Record<Language, string>>;

export type TranslationKey = keyof typeof translations;

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "ta" ? "ta" : DEFAULT_LANGUAGE; // anything else (including unset) -> English
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage can be unavailable (private browsing, etc.) — the
      // language still works for this session, it just won't persist.
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[key][language] ?? translations[key][DEFAULT_LANGUAGE],
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
