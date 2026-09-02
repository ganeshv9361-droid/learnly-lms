import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Particles from "../components/Particles";
import Logo from "../components/Logo";
import { signInWithGoogle } from "../firebase";
import AUTH_BG from '../assets/background.jpg';

export default function Login({ onSwitch }) {
  const { login, loginWithFirebase } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
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
    return () => {
      mounted = false;
    };
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(form.email.trim(), form.password);
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await signInWithGoogle();

      if (!result?.user) {
        throw new Error("Google authentication failed");
      }

      const token = await result.user.getIdToken();
      await loginWithFirebase(token);
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Google sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

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
        
        {/* Mobile top branding with server online dot near subtitle sentence */}
        <div className="lg:hidden text-center mb-5 w-full animate-fade-up">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <img src="/logo.png" alt="Learnly" className="w-9 h-9 object-contain" />
            <Logo size={0} showText={true} textSize="text-2xl" />
          </div>
          <div className="inline-flex items-center justify-center gap-2">
            <p className="text-xs text-gray-400 font-medium tracking-wide">
              Learn smarter. Build your future.
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

            <div className="flex items-center gap-3 mt-4 mb-2">
              <h1
                className="font-display font-extrabold leading-[1.05] text-white"
                style={{ fontSize: "clamp(2.8rem, 4.5vw, 5.2rem)" }}
              >
                Learn smarter. Grow faster.
              </h1>
              {serverStatus === "online" && (
                <span className="flex h-3.5 w-3.5 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-[0_0_12px_#10b981]"></span>
                </span>
              )}
            </div>

            <p className="mt-4 text-base sm:text-lg leading-relaxed max-w-xl text-gray-300">
              One place for courses, AI-powered learning, quizzes, assignments,
              progress tracking and certificates.
            </p>

            <div className="grid sm:grid-cols-2 gap-3.5 mt-8 max-w-xl">
              {[
                ["🎓", "Expert courses", "Build practical, real-world skills"],
                ["🤖", "AI Tutor", "Get help whenever you need it"],
                ["📈", "Track progress", "See how far you have come"],
                ["🏆", "Earn certificates", "Showcase your achievements"],
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

          {/* Right Login Form Section (Transparent / No Box) */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto animate-fade-up">

            <div className="w-full pb-2">
              <div className="mb-5 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Sign in to Learnly</h2>
                <p className="mt-1.5 text-xs sm:text-sm text-gray-400 font-normal">
                  Continue your learning journey.
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

              <form onSubmit={handleEmailLogin} className="space-y-3.5">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px]">✉️</span>
                    <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                      Email
                    </label>
                  </div>
                  {/* Made slightly smaller with h-10 */}
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
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
                    {/* Made slightly smaller with h-10 */}
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      className="w-full px-3.5 pr-14 h-10 text-xs sm:text-sm bg-black/40 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 focus:outline-none transition-all shadow-inner"
                      placeholder="enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-purple-400 hover:text-purple-300 px-1.5 py-0.5 transition-colors"
                    >
                      {showPass ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Sign in and Register Buttons Side-by-Side guaranteed on mobile & desktop */}
                <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 text-white rounded-xl font-semibold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-600/25 hover:shadow-purple-600/40 hover:brightness-110 active:scale-[0.99] flex items-center justify-center gap-1 px-2 whitespace-nowrap"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%)",
                    }}
                  >
                    <span>{loading ? "Signing..." : "Sign in"}</span>
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
                    <span>Register</span>
                    <span className="text-[11px]">→</span>
                  </button>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 h-10 rounded-xl font-medium text-xs sm:text-sm disabled:opacity-50 transition-all hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.99] shadow-sm mt-1"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>{loading ? "Signing in..." : "Continue with Google"}</span>
                </button>
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