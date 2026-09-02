import { useEffect, useState } from "react";
import api from "../api/axios";
import Particles from "../components/Particles";
import Logo from "../components/Logo";

const AUTH_BG = '/public/background.jpg';

export default function Register({ onSwitch }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    referral_code: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking");

  useEffect(() => {
    let mounted = true;

    const checkServer = async () => {
      try {
        const response = await fetch("https://learnly-lms-hqch.onrender.com/", {
          method: "GET",
        });
        if (!mounted) return;
        setServerStatus(response.ok ? "online" : "waking");
      } catch {
        if (mounted) setServerStatus("waking");
      }
    };

    checkServer();

    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      setForm((f) => ({ ...f, referral_code: ref }));
    }

    return () => {
      mounted = false;
    };
  }, []);

  const handle = async (e) => {
    e.preventDefault();

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = { ...form };
      if (!payload.referral_code) delete payload.referral_code;
      await api.post("/users/register", payload);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = form.password;
    if (!password) return { score: 0, label: "" };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score, label: "Weak password" };
    if (score === 2) return { score, label: "Fair password" };
    if (score === 3) return { score, label: "Good password" };
    return { score, label: "Strong password" };
  };

  const passwordStrength = getPasswordStrength();

  if (success) {
    return (
      <div
        className="min-h-screen min-h-dvh flex items-center justify-center px-4 relative overflow-hidden bg-cover bg-center"
        style={{
          backgroundColor: "#070811",
          backgroundImage: `linear-gradient(rgba(5,7,20,0.82), rgba(5,7,20,0.92)), url("${AUTH_BG}")`,
        }}
      >
        <Particles />
        <div className="relative z-10 w-full max-w-md text-center p-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
            style={{
              background: "rgba(52,211,153,0.10)",
              border: "1px solid rgba(52,211,153,0.25)",
              boxShadow: "0 0 45px rgba(52,211,153,0.14)",
            }}
          >
            ✓
          </div>
          <div className="flex justify-center mb-4">
            <Logo size={0} showText={true} textSize="text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You're in! 🎉</h2>
          <p className="text-sm mb-6 text-gray-300">
            Your account has been created successfully.
            <br />
            Your learning journey starts now.
          </p>
          <button onClick={onSwitch} className="w-full py-3 text-white rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-cyan-500 shadow-lg shadow-purple-600/30">
            Sign in and start learning →
          </button>
          <p className="text-xs mt-4 text-gray-400">
            🎓 Welcome to the Learnly community
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen min-h-dvh relative overflow-x-hidden overflow-y-auto bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center py-6 px-4 sm:px-6"
      style={{
        backgroundColor: "#070811",
        backgroundImage: `linear-gradient(135deg, rgba(5,7,20,0.92) 0%, rgba(5,7,20,0.82) 50%, rgba(5,7,20,0.70) 100%), url("${AUTH_BG}")`,
      }}
    >
      <Particles />

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(124,58,237,0.15), transparent 45%), radial-gradient(circle at 85% 80%, rgba(6,182,212,0.10), transparent 45%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Mobile top branding with server online dot */}
        <div className="lg:hidden text-center mb-5 w-full animate-fade-up">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <img src="/logo.png" alt="Learnly" className="w-9 h-9 object-contain" />
            <Logo size={0} showText={true} textSize="text-2xl" />
          </div>
          <div className="inline-flex items-center justify-center gap-2">
            <p className="text-xs text-gray-400 font-medium tracking-wide">
              Join thousands of learners
            </p>
            {serverStatus === "online" && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              </span>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center w-full">
          
          {/* Desktop Left Hero Section */}
          <div className="hidden lg:block lg:col-span-7 animate-fade-up pr-4">
            <div className="flex items-center gap-4 mb-6">
              <img src="/logo.png" alt="Learnly" className="w-14 h-14 object-contain" />
              <Logo size={0} showText={true} textSize="text-5xl" />
            </div>

            {/* Headline with correctly anchored green status dot */}
            <div className="flex items-start gap-3 mt-4 mb-2">
              <h1
                className="font-display font-extrabold leading-[1.05] text-white"
                style={{ fontSize: "clamp(2.8rem, 4.5vw, 5.2rem)" }}
              >
                Start your learning journey.
              </h1>
              {serverStatus === "online" && (
                <span className="flex h-3.5 w-3.5 relative shrink-0 mt-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-[0_0_12px_#10b981]"></span>
                </span>
              )}
            </div>

            <p className="mt-4 text-base sm:text-lg leading-relaxed max-w-xl text-gray-300">
              Create your free Learnly account and unlock a smarter way to
              learn, practice, track your progress and grow your skills.
            </p>

            <div className="grid sm:grid-cols-2 gap-3.5 mt-8 max-w-xl">
              {[
                ["📚", "Quality courses", "Learn at your own pace"],
                ["🤖", "AI Tutor", "Instant help when you need it"],
                ["🎯", "Practice & improve", "Quizzes and assignments"],
                ["🏆", "Earn certificates", "Celebrate your progress"],
              ].map(([icon, title, text]) => (
                <div
                  key={title}
                  className="flex items-center gap-3.5 p-4 rounded-2xl transition-all hover:border-purple-500/30 hover:bg-white/[0.06]"
                  style={{
                    background: "rgba(12,16,35,0.40)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-lg shadow-inner"
                    style={{
                      background: "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(6,182,212,0.14))",
                      border: "1px solid rgba(139,92,246,0.20)",
                    }}
                  >
                    {icon}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-xs sm:text-sm">{title}</div>
                    <div className="text-[11px] mt-0.5 text-gray-400">{text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Register Form Section (Transparent / No Box) */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto animate-fade-up">

            <div className="w-full pb-2">
              <div className="mb-5 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Create your account</h2>
                <p className="mt-1.5 text-xs sm:text-sm text-gray-400 font-normal">
                  Free forever. No credit card needed.
                </p>
              </div>

              {error && (
                <div
                  className="mb-4 px-4 py-2.5 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: "#fecaca",
                  }}
                >
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handle} className="space-y-3.5">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px]">👤</span>
                    <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                      Full Name
                    </label>
                  </div>
                  <input
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 h-10 text-xs sm:text-sm bg-black/40 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 focus:outline-none transition-all shadow-inner"
                    placeholder="enter your name"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px]">✉️</span>
                    <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                      Email
                    </label>
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 h-10 text-xs sm:text-sm bg-black/40 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 focus:outline-none transition-all shadow-inner"
                    placeholder="enter your mail"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]">🔒</span>
                      <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                        Password
                      </label>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3.5 pr-14 h-10 text-xs sm:text-sm bg-black/40 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 focus:outline-none transition-all shadow-inner"
                      placeholder="enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-purple-400 hover:text-purple-300 px-1.5 py-0.5 transition-colors"
                    >
                      {showPass ? "Hide" : "Show"}
                    </button>
                  </div>

                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((item) => (
                          <div
                            key={item}
                            className="h-1 flex-1 rounded-full"
                            style={{
                              background: item <= passwordStrength.score ? "#34d399" : "rgba(255,255,255,0.10)",
                            }}
                          />
                        ))}
                      </div>
                      <div className="text-[10px] mt-1" style={{ color: passwordStrength.score >= 3 ? "#6ee7b7" : "#94a3b8" }}>
                        {passwordStrength.label}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px]">🎓</span>
                    <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                      I am a
                    </label>
                  </div>
                  <div
                    className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40 border border-white/15"
                  >
                    {[["student", "🎓", "Student"], ["teacher", "👨‍🏫", "Teacher"]].map(([role, icon, label]) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setForm({ ...form, role })}
                        className="py-2 px-2 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: form.role === role
                            ? "linear-gradient(90deg, #7c3aed, #2563eb, #06b6d4)"
                            : "transparent",
                          color: form.role === role ? "#fff" : "rgba(255,255,255,0.55)",
                        }}
                      >
                        <span className="mr-1">{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px]">🎁</span>
                    <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                      Referral code <span className="normal-case opacity-60 text-[10px]">(optional)</span>
                    </label>
                  </div>
                  <input
                    value={form.referral_code}
                    onChange={(e) => setForm({ ...form, referral_code: e.target.value })}
                    className="w-full px-3.5 h-10 text-xs sm:text-sm bg-black/40 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 focus:outline-none transition-all shadow-inner"
                    placeholder="enter referral code"
                  />
                </div>

                {/* Create Account & Sign In Buttons Side-by-Side */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 text-white rounded-xl font-semibold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-600/25 hover:shadow-purple-600/40 hover:brightness-110 active:scale-[0.99] flex items-center justify-center gap-1 px-2 whitespace-nowrap"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%)",
                    }}
                  >
                    <span>{loading ? "Creating..." : "Create account"}</span>
                    <span className="text-[11px]">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={onSwitch}
                    className="w-full h-10 text-purple-300 rounded-xl font-semibold text-xs sm:text-sm transition-all hover:text-white hover:border-purple-400/40 active:scale-[0.99] flex items-center justify-center gap-1 px-2 text-center whitespace-nowrap"
                    style={{
                      background: "rgba(124,58,237,0.15)",
                      border: "1px solid rgba(139,92,246,0.3)",
                    }}
                  >
                    <span>Sign in</span>
                    <span className="text-[11px]">→</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Secure authentication message outside */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
              <span>🔒</span>
              <span>Secure authentication for your account</span>
            </div>

          </div>

        </div>

        

      </div>
    </div>
  );
}