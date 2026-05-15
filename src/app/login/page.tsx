"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Credenciais inválidas");
      }
    } catch (err) {
      setError("Ocorreu um erro ao tentar entrar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#051C2C] relative overflow-hidden font-body">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-vibrant-cyan/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      
      <div className="w-full max-w-md p-6 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/5 border border-white/10 mb-6 shadow-2xl backdrop-blur-xl">
            <span className="text-4xl font-heading font-bold text-vibrant-cyan tracking-tighter">B</span>
          </div>
          <h1 className="text-4xl font-heading font-bold text-white uppercase tracking-tighter mb-2">Bellatrix</h1>
          <p className="text-slate-400 font-heading font-bold uppercase tracking-[0.3em] text-[10px]">Premium CRM System</p>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-10 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-xs font-heading font-bold uppercase tracking-widest text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">E-mail de Acesso</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-vibrant-cyan transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/10 focus:border-vibrant-cyan/50 focus:ring-4 focus:ring-vibrant-cyan/5 rounded-2xl outline-none transition-all text-white font-medium text-sm placeholder:text-slate-600"
                  placeholder="adm@bellatrix.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Sua Senha</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-vibrant-cyan transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-14 py-4.5 bg-white/5 border border-white/10 focus:border-vibrant-cyan/50 focus:ring-4 focus:ring-vibrant-cyan/5 rounded-2xl outline-none transition-all text-white font-medium text-sm placeholder:text-slate-600"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-vibrant-cyan font-heading font-bold uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-10"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar no Sistema
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-10 text-slate-500 text-[9px] font-heading font-bold uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} Bellatrix CRM &bull; Versão Premium 1.0
        </p>
      </div>
    </div>
  );
}
