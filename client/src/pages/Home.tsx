import { Link } from "wouter";
import {
  Sprout,
  Wheat,
  TrendingUp,
  Bug,
  Droplets,
  Brain,
  Languages,
  FileText,
  ShieldCheck,
  Database,
  Leaf,
  ClipboardList,
  LogIn,
  ArrowRight,
  LineChart,
  Smartphone,
  Coins,
  Clock,
  Target,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage, type Language } from "@/lib/i18n";
import { useCurrentUser } from "@/hooks/use-auth";

type Bi = Record<Language, string>;
const bi = (en: string, ta: string): Bi => ({ en, ta });

// All Home Page text lives here so that switching to Tamil changes everything.
const c = {
  brand: bi("AgriSmart AI", "AgriSmart AI"),
  tagline: bi("Farmer Advisory AI Agent", "விவசாயி ஆலோசனை அமைப்பு"),
  nav: {
    about: bi("About", "திட்டம்"),
    features: bi("Features", "அம்சங்கள்"),
    how: bi("How It Works", "செயல்பாடு"),
    workflow: bi("Workflow", "செயல்முறை"),
  },
  disclaimer: bi(
    "AI-based advisory support for farmers — not a substitute for agricultural experts.",
    "விவசாயிகளுக்கான AI அடிப்படையிலான ஆலோசனை உதவி — வேளாண் நிபுணர்களுக்கு மாற்றாக அல்ல."
  ),
  login: bi("Login", "உள்நுழைவு"),
  getStarted: bi("Get Started", "தொடங்குக"),
  dashboard: bi("Go to Dashboard", "டாஷ்போர்டுக்குச் செல்"),
  adminPanel: bi("Go to Admin Panel", "நிர்வாக பலகத்துக்குச் செல்"),

  hero: {
    badge: bi("AI for Smart Farming", "ஸ்மார்ட் விவசாயத்திற்கான AI"),
    intro: bi(
      "AgriSmart AI helps farmers decide what to grow, how much to expect, when pests may attack and how much water to give. Enter your soil and weather details and get simple, clear advice in English or Tamil.",
      "உங்கள் மண் மற்றும் வானிலை விவரங்களை உள்ளிட்டால், எந்தப் பயிரை விளைவிக்கலாம், எவ்வளவு மகசூல் கிடைக்கும், பூச்சி தாக்குதல் வருமா, எவ்வளவு தண்ணீர் பாய்ச்சலாம் என்பதை AgriSmart AI எளிய தமிழில் சொல்லும்."
    ),
    sampleTitle: bi("Sample AI Analysis", "மாதிரி AI பகுப்பாய்வு"),
    sampleNote: bi(
      "Illustrative example only. Log in to get results for your own farm.",
      "இது ஒரு மாதிரி மட்டுமே. உங்கள் வயலுக்கான முடிவுகளைப் பெற உள்நுழையவும்."
    ),
    cropLabel: bi("Crop Recommendation", "பயிர் பரிந்துரை"),
    cropValue: bi("Rice", "நெல்"),
    yieldLabel: bi("Est. Yield", "மதிப்பிடப்பட்ட மகசூல்"),
    yieldValue: bi("4.2 tons / hectare", "4.2 டன் / ஹெக்டேர்"),
    pestLabel: bi("Pest Risk Level", "பூச்சி அபாய நிலை"),
    pestValue: bi("Medium", "நடுத்தரம்"),
    irrLabel: bi("Irrigation Advisory", "பாசன ஆலோசனை"),
    irrValue: bi("Moderate irrigation recommended.", "மிதமான அளவு பாசனம் செய்யவும்."),
    advLabel: bi("Farmer Advisory", "விவசாயி ஆலோசனை"),
    advValue: bi(
      "Check leaves every 3 days and keep the field well drained.",
      "3 நாட்களுக்கு ஒருமுறை இலைகளைப் பார்க்கவும்; வயலில் நீர் தேங்காமல் பார்த்துக்கொள்ளவும்."
    ),
  },

  about: {
    title: bi("About the Project", "திட்டத்தைப் பற்றி"),
    p1: bi(
      "AgriSmart AI is a web-based farmer advisory system built on machine learning. It studies soil nutrients (N, P, K), soil pH, temperature, humidity, rainfall and past pest history to give data-based advice for each field.",
      "AgriSmart AI என்பது இயந்திரக் கற்றல் (Machine Learning) அடிப்படையிலான இணைய விவசாய ஆலோசனை அமைப்பு. மண் சத்துகள் (N, P, K), மண் pH, வெப்பநிலை, ஈரப்பதம், மழையளவு, முந்தைய பூச்சி பாதிப்பு ஆகியவற்றை ஆராய்ந்து ஒவ்வொரு வயலுக்கும் தகவல் சார்ந்த ஆலோசனை வழங்குகிறது."
    ),
    p2: bi(
      "One simple form gives four answers together: the best crop, expected yield, pest risk and irrigation advice. Results are saved in your dashboard and can be downloaded as a report.",
      "ஒரே படிவத்தில் நான்கு பதில்கள் கிடைக்கும்: சிறந்த பயிர், எதிர்பார்க்கும் மகசூல், பூச்சி அபாயம், பாசன ஆலோசனை. முடிவுகள் டாஷ்போர்டில் சேமிக்கப்படும்; அறிக்கையாகவும் பதிவிறக்கம் செய்யலாம்."
    ),
  },

  problem: {
    title: bi("Problem Statement", "பிரச்சினை விளக்கம்"),
    intro: bi(
      "Many farmers still decide using guesswork and habit. This leads to:",
      "பல விவசாயிகள் இன்னும் அனுபவம் மற்றும் யூகத்தை வைத்தே முடிவு எடுக்கிறார்கள். இதனால்:"
    ),
    items: [
      bi("Wrong crop choice for the soil and season", "மண்ணுக்கும் பருவத்துக்கும் பொருந்தாத பயிர் தேர்வு"),
      bi("Low or unpredictable yield and income", "குறைவான, நிச்சயமற்ற மகசூல் மற்றும் வருமானம்"),
      bi("Crop loss because pests are noticed too late", "பூச்சிகள் தாமதமாகத் தெரிவதால் பயிர் இழப்பு"),
      bi("Water wasted by over- or under-irrigation", "அதிகமாகவோ குறைவாகவோ பாசனம் செய்வதால் தண்ணீர் வீண்"),
      bi("Little access to expert advice in local language", "தாய்மொழியில் நிபுணர் ஆலோசனை கிடைப்பது கடினம்"),
    ],
    solution: bi(
      "AgriSmart AI solves this by turning farm data into quick, easy-to-understand advice.",
      "பண்ணைத் தரவை விரைவான, எளிதில் புரியும் ஆலோசனையாக மாற்றி AgriSmart AI இதற்குத் தீர்வு தருகிறது."
    ),
  },

  features: {
    title: bi("Key Features", "முக்கிய அம்சங்கள்"),
    items: [
      { icon: Wheat, t: bi("Crop Recommendation", "பயிர் பரிந்துரை"), d: bi("Suggests the best crop for your soil and weather.", "உங்கள் மண் மற்றும் வானிலைக்கு ஏற்ற சிறந்த பயிரைப் பரிந்துரைக்கும்.") },
      { icon: TrendingUp, t: bi("Yield Prediction", "மகசூல் கணிப்பு"), d: bi("Estimates the expected harvest before you sow.", "விதைப்பதற்கு முன்பே எதிர்பார்க்கும் மகசூலை மதிப்பிடும்.") },
      { icon: Bug, t: bi("Pest Risk Prediction", "பூச்சி அபாயக் கணிப்பு"), d: bi("Shows Low, Medium or High pest risk early.", "குறைவு, நடுத்தரம், அதிகம் என பூச்சி அபாயத்தை முன்கூட்டியே காட்டும்.") },
      { icon: Droplets, t: bi("Irrigation Advisory", "பாசன ஆலோசனை"), d: bi("Tells how much water your field needs.", "உங்கள் வயலுக்கு எவ்வளவு தண்ணீர் தேவை என்று சொல்லும்.") },
      { icon: Languages, t: bi("English & Tamil", "ஆங்கிலம் & தமிழ்"), d: bi("Use the app in the language you are comfortable with.", "உங்களுக்கு வசதியான மொழியில் பயன்படுத்தலாம்.") },
      { icon: FileText, t: bi("Reports & History", "அறிக்கை & வரலாறு"), d: bi("Save past results and download a PDF report.", "முந்தைய முடிவுகளைச் சேமித்து PDF அறிக்கையைப் பதிவிறக்கலாம்.") },
    ],
  },

  modules: {
    title: bi("What the System Predicts", "அமைப்பு எதைக் கணிக்கிறது"),
    items: [
      {
        icon: Wheat,
        t: bi("Crop Recommendation", "பயிர் பரிந்துரை"),
        d: bi(
          "Compares your soil nutrients, pH and weather with patterns learned from data, and recommends the crop most likely to grow well: Wheat, Rice, Maize, Cotton or Soybean.",
          "உங்கள் மண் சத்துகள், pH, வானிலை ஆகியவற்றைத் தரவிலிருந்து கற்ற வடிவங்களுடன் ஒப்பிட்டு, நன்கு வளரக்கூடிய பயிரைப் பரிந்துரைக்கும்: கோதுமை, நெல், மக்காச்சோளம், பருத்தி அல்லது சோயா."
        ),
      },
      {
        icon: TrendingUp,
        t: bi("Yield Prediction", "மகசூல் கணிப்பு"),
        d: bi(
          "Estimates the expected yield from soil nutrients and rainfall, so you can plan costs, storage and selling.",
          "மண் சத்துகள் மற்றும் மழையளவைக் கொண்டு எதிர்பார்க்கும் மகசூலை மதிப்பிடும்; செலவு, சேமிப்பு, விற்பனையைத் திட்டமிட உதவும்."
        ),
      },
      {
        icon: Bug,
        t: bi("Pest Risk Prediction", "பூச்சி அபாயக் கணிப்பு"),
        d: bi(
          "Uses humidity, temperature and earlier pest history to classify risk as Low, Medium or High, so you can act before damage spreads.",
          "ஈரப்பதம், வெப்பநிலை, முந்தைய பூச்சி பாதிப்பு ஆகியவற்றைக் கொண்டு அபாயத்தை குறைவு, நடுத்தரம், அதிகம் எனப் பிரிக்கும்; சேதம் பரவுவதற்கு முன் நடவடிக்கை எடுக்கலாம்."
        ),
      },
      {
        icon: Droplets,
        t: bi("Irrigation Advisory", "பாசன ஆலோசனை"),
        d: bi(
          "Reads rainfall and humidity and advises: no irrigation, minimal, moderate or heavy irrigation. This saves water and effort.",
          "மழையளவு மற்றும் ஈரப்பதத்தைப் பார்த்து பாசனம் தேவையில்லை, குறைவு, மிதம் அல்லது அதிகம் என ஆலோசனை தரும்; தண்ணீரும் உழைப்பும் மிச்சமாகும்."
        ),
      },
    ],
  },

  how: {
    title: bi("How the AI System Works", "AI அமைப்பு எவ்வாறு செயல்படுகிறது"),
    steps: [
      { icon: ClipboardList, t: bi("1. Enter farm data", "1. பண்ணை விவரங்களை உள்ளிடுக"), d: bi("N, P, K, pH, temperature, humidity, rainfall and past pest count.", "N, P, K, pH, வெப்பநிலை, ஈரப்பதம், மழையளவு, முந்தைய பூச்சி எண்ணிக்கை.") },
      { icon: Database, t: bi("2. Models are trained on data", "2. தரவில் மாதிரிகள் பயிற்சி பெறுகின்றன"), d: bi("Machine learning models learn patterns from crop and weather data.", "பயிர் மற்றும் வானிலை தரவிலிருந்து இயந்திரக் கற்றல் மாதிரிகள் வடிவங்களைக் கற்கின்றன.") },
      { icon: Brain, t: bi("3. AI analysis", "3. AI பகுப்பாய்வு"), d: bi("Random Forest predicts crop and yield; a Decision Tree predicts pest risk; simple rules give irrigation advice.", "Random Forest பயிர் மற்றும் மகசூலையும், Decision Tree பூச்சி அபாயத்தையும் கணிக்கும்; எளிய விதிகள் பாசன ஆலோசனை தரும்.") },
      { icon: Leaf, t: bi("4. Farmer advisory", "4. விவசாயி ஆலோசனை"), d: bi("You see clear results and advice on your dashboard.", "தெளிவான முடிவுகளும் ஆலோசனையும் உங்கள் டாஷ்போர்டில் தெரியும்.") },
    ],
  },

  benefits: {
    title: bi("Benefits for Farmers", "விவசாயிகளுக்கான நன்மைகள்"),
    items: [
      { icon: Target, t: bi("Better crop decisions", "சிறந்த பயிர் முடிவுகள்"), d: bi("Grow what suits your land.", "உங்கள் நிலத்துக்கு ஏற்றதை விளைவிக்கலாம்.") },
      { icon: Coins, t: bi("Higher income, lower cost", "அதிக வருமானம், குறைந்த செலவு"), d: bi("Avoid wasted seed, water and inputs.", "விதை, தண்ணீர், இடுபொருள் வீணாவதைத் தவிர்க்கலாம்.") },
      { icon: ShieldCheck, t: bi("Early pest warning", "பூச்சிகள் குறித்த முன்னெச்சரிக்கை"), d: bi("Protect the crop before damage spreads.", "சேதம் பரவுவதற்கு முன் பயிரைப் பாதுகாக்கலாம்.") },
      { icon: Droplets, t: bi("Water saving", "தண்ணீர் சேமிப்பு"), d: bi("Irrigate only as much as needed.", "தேவையான அளவு மட்டும் பாசனம் செய்யலாம்.") },
      { icon: Clock, t: bi("Quick results", "உடனடி முடிவுகள்"), d: bi("Advice in seconds, anytime.", "எப்போதும் சில விநாடிகளில் ஆலோசனை.") },
      { icon: Smartphone, t: bi("Easy to use, in Tamil", "எளிதான, தமிழில் பயன்பாடு"), d: bi("Simple screens, works on phone and computer.", "எளிய திரைகள்; கைபேசி மற்றும் கணினியில் செயல்படும்.") },
    ],
  },

  workflow: {
    title: bi("Project Workflow", "திட்ட செயல்முறை"),
    steps: [
      { icon: Sprout, t: bi("Home Page", "முகப்புப் பக்கம்") },
      { icon: LogIn, t: bi("Login", "உள்நுழைவு") },
      { icon: Brain, t: bi("AI Analysis / Model", "AI பகுப்பாய்வு / மாதிரி") },
      { icon: LineChart, t: bi("Prediction Results", "கணிப்பு முடிவுகள்") },
      { icon: ClipboardList, t: bi("Dashboard", "டாஷ்போர்டு") },
    ],
  },

  cta: {
    title: bi("Ready to farm smarter?", "புத்திசாலித்தனமாக விவசாயம் செய்யத் தயாரா?"),
    text: bi("Log in and get advice for your field in a few seconds.", "உள்நுழைந்து சில விநாடிகளில் உங்கள் வயலுக்கான ஆலோசனையைப் பெறுங்கள்."),
  },

  footer: {
    about: bi(
      "AgriSmart AI – an AI-based farmer advisory system for crop recommendation, yield prediction, pest risk prediction and irrigation advice.",
      "AgriSmart AI – பயிர் பரிந்துரை, மகசூல் கணிப்பு, பூச்சி அபாயக் கணிப்பு மற்றும் பாசன ஆலோசனைக்கான AI அடிப்படையிலான விவசாயி ஆலோசனை அமைப்பு."
    ),
    quick: bi("Quick Links", "விரைவு இணைப்புகள்"),
    register: bi("Register", "பதிவு செய்க"),
    note: bi("Advice is based on machine learning models and is meant to support, not replace, a farmer's own judgement.", "இந்த ஆலோசனை இயந்திரக் கற்றல் மாதிரிகளை அடிப்படையாகக் கொண்டது; விவசாயியின் சொந்த முடிவுக்குத் துணையாக மட்டுமே பயன்படுத்தவும்."),
    rights: bi("All rights reserved.", "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை."),
  },
};

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-10">
      <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">{children}</h2>
      {sub && <p className="mt-3 text-muted-foreground">{sub}</p>}
      <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-primary/70" />
    </div>
  );
}

export default function Home() {
  const { language } = useLanguage();
  const { data: user } = useCurrentUser();
  const L = (b: Bi) => b[language];

  const isLoggedIn = !!user;
  const appHref = user?.isAdmin ? "/admin" : "/dashboard";
  const loginHref = isLoggedIn ? appHref : "/login";
  const loginLabel = isLoggedIn ? L(user?.isAdmin ? c.adminPanel : c.dashboard) : L(c.login);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={language === "ta" ? { fontFamily: "'Noto Sans Tamil', 'Latha', var(--font-sans)", lineHeight: 1.7 } : undefined}
      lang={language}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/20 border-t-0 border-x-0 rounded-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center space-x-3 text-left" data-testid="link-home-brand">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Sprout className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-lg font-bold font-display leading-tight">{L(c.brand)}</div>
              <div className="hidden sm:block text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{L(c.tagline)}</div>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <button onClick={() => scrollTo("about")} className="hover:text-foreground">{L(c.nav.about)}</button>
            <button onClick={() => scrollTo("features")} className="hover:text-foreground">{L(c.nav.features)}</button>
            <button onClick={() => scrollTo("how")} className="hover:text-foreground">{L(c.nav.how)}</button>
            <button onClick={() => scrollTo("workflow")} className="hover:text-foreground">{L(c.nav.workflow)}</button>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href={loginHref}>
              <Button size="sm" data-testid="button-login-header">
                <LogIn className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">{loginLabel}</span>
                <span className="sm:hidden">{isLoggedIn ? "" : L(c.login)}</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center relative">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              <Sprout className="w-3.5 h-3.5" /> {L(c.hero.badge)}
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl font-bold font-display leading-tight">
              <span className="text-gradient">{L(c.brand)}</span>
            </h1>
            <p className="mt-2 text-lg font-semibold text-foreground/80">{L(c.tagline)}</p>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg">{L(c.hero.intro)}</p>
            <p
              className="mt-4 flex items-start gap-2 text-xs sm:text-sm text-muted-foreground border-l-2 border-primary/40 pl-3"
              data-testid="text-disclaimer"
            >
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary/70" aria-hidden />
              <span>{L(c.disclaimer)}</span>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login">
                <Button size="lg" data-testid="button-get-started">
                  {L(c.getStarted)} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href={loginHref}>
                <Button size="lg" variant="outline" data-testid="button-login-hero">
                  <LogIn className="w-4 h-4 mr-2" /> {loginLabel}
                </Button>
              </Link>
            </div>
          </div>

          {/* Sample analysis card */}
          <div className="glass-panel rounded-2xl p-6 bg-white/70">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="font-bold font-display">{L(c.hero.sampleTitle)}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Wheat, l: c.hero.cropLabel, v: c.hero.cropValue },
                { icon: TrendingUp, l: c.hero.yieldLabel, v: c.hero.yieldValue },
                { icon: Bug, l: c.hero.pestLabel, v: c.hero.pestValue },
                { icon: Droplets, l: c.hero.irrLabel, v: c.hero.irrValue },
              ].map(({ icon: Icon, l, v }, i) => (
                <div key={i} className="rounded-xl border bg-white/80 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Icon className="w-3.5 h-3.5 text-primary" /> {L(l)}
                  </div>
                  <div className="mt-1 font-semibold text-sm">{L(v)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                <Leaf className="w-3.5 h-3.5" /> {L(c.hero.advLabel)}
              </div>
              <div className="mt-1 text-sm">{L(c.hero.advValue)}</div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{L(c.hero.sampleNote)}</p>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-14 bg-white/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <SectionTitle>{L(c.about.title)}</SectionTitle>
          <div className="space-y-4 text-muted-foreground text-base sm:text-lg text-center">
            <p>{L(c.about.p1)}</p>
            <p>{L(c.about.p2)}</p>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <SectionTitle sub={L(c.problem.intro)}>{L(c.problem.title)}</SectionTitle>
          <ul className="grid sm:grid-cols-2 gap-3">
            {c.problem.items.map((it, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border bg-white/70 p-4">
                <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                <span>{L(it)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center font-semibold text-primary">{L(c.problem.solution)}</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-14 bg-white/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionTitle>{L(c.features.title)}</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {c.features.items.map(({ icon: Icon, t, d }, i) => (
              <div key={i} className="rounded-2xl border bg-white/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold font-display">{L(t)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{L(d)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Four modules */}
      <section id="modules" className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionTitle>{L(c.modules.title)}</SectionTitle>
          <div className="grid md:grid-cols-2 gap-5">
            {c.modules.items.map(({ icon: Icon, t, d }, i) => (
              <div key={i} className="flex gap-4 rounded-2xl border bg-white/80 p-5">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold font-display text-lg">{L(t)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{L(d)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-14 bg-white/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionTitle>{L(c.how.title)}</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {c.how.steps.map(({ icon: Icon, t, d }, i) => (
              <div key={i} className="rounded-2xl border bg-white/80 p-5 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold font-display">{L(t)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{L(d)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionTitle>{L(c.benefits.title)}</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {c.benefits.items.map(({ icon: Icon, t, d }, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border bg-white/70 p-4">
                <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold">{L(t)}</div>
                  <div className="text-sm text-muted-foreground">{L(d)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionTitle>{L(c.workflow.title)}</SectionTitle>
          <ol className="flex flex-col md:flex-row md:items-stretch gap-3 md:gap-2">
            {c.workflow.steps.map(({ icon: Icon, t }, i) => (
              <li key={i} className="flex md:flex-1 items-center gap-2">
                <div className="flex-1 rounded-2xl border bg-white/80 p-4 text-center h-full">
                  <div className="w-10 h-10 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-2">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-semibold">{L(t)}</div>
                </div>
                {i < c.workflow.steps.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-primary shrink-0 rotate-90 md:rotate-0 hidden md:block" aria-hidden />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold font-display">{L(c.cta.title)}</h2>
            <p className="mt-3 opacity-90">{L(c.cta.text)}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/login">
                <Button size="lg" variant="secondary" data-testid="button-get-started-cta">
                  {L(c.getStarted)} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href={loginHref}>
                <Button size="lg" variant="outline" className="bg-transparent border-white/60 text-white hover:bg-white/10 hover:text-white" data-testid="button-login-cta">
                  {loginLabel}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 font-bold font-display text-lg">
              <Sprout className="w-5 h-5 text-primary" /> {L(c.brand)}
            </div>
            <p className="mt-3 text-muted-foreground">{L(c.footer.about)}</p>
          </div>
          <div>
            <h4 className="font-bold font-display mb-3">{L(c.footer.quick)}</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/login" className="hover:text-foreground">{L(c.login)}</Link></li>
              <li><Link href="/register" className="hover:text-foreground">{L(c.footer.register)}</Link></li>
              <li><button onClick={() => scrollTo("about")} className="hover:text-foreground">{L(c.about.title)}</button></li>
              <li><button onClick={() => scrollTo("features")} className="hover:text-foreground">{L(c.features.title)}</button></li>
            </ul>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{L(c.footer.note)}</p>
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {L(c.brand)}. {L(c.footer.rights)}
        </div>
      </footer>
    </div>
  );
}
