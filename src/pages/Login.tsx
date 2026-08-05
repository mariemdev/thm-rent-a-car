import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Car, Lock, Mail, Loader2, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // View state: login, forgot, reset
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>(
    window.location.pathname === '/reset-password' ? 'reset' : 'login'
  );

  // Login states
  const [email, setEmail] = useState("admin@automanager.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  // Reset password states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // URL query search params for feedback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "true") {
      toast.success("Votre compte a été vérifié avec succès ! Vous pouvez maintenant vous connecter.");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUnverifiedEmail(null);
    try {
      const { token, user } = await api.login({ email, password });
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      toast.success(t("common.success"));
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      let errMsg = t("common.error");
      if (error.message) {
        try {
          const parsed = JSON.parse(error.message);
          errMsg = parsed.message || errMsg;
          if (parsed.unverified) {
            setUnverifiedEmail(parsed.email || email);
          }
        } catch (e) {
          errMsg = error.message;
        }
      }
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setLoading(true);
    try {
      await api.resendVerification(unverifiedEmail);
      toast.success("Un email de vérification a été renvoyé.");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDevResetToken(null);
    try {
      const response = await api.forgotPassword(forgotEmail);
      setForgotSuccess(true);
      toast.success("Email envoyé avec succès.");
      if (response.dev_reset_token) {
        setDevResetToken(response.dev_reset_token);
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la demande");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      toast.error("Token de réinitialisation manquant.");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, newPassword);
      setResetSuccess(true);
      toast.success("Mot de passe réinitialisé !");
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la réinitialisation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-50 animate-pulse delay-700"></div>
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="h-2 bg-blue-600"></div>
        
        {/* LOGIN VIEW */}
        {view === 'login' && (
          <>
            <CardHeader className="space-y-1 pt-8 text-center">
              <div className="mx-auto bg-blue-600 p-3 rounded-2xl w-fit mb-4 shadow-lg shadow-blue-200">
                <Car className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">THM RENT A CAR</CardTitle>
              <CardDescription className="text-slate-500">
                {t("nav.login")} - Management System
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <Input 
                      type="email" 
                      placeholder="Email" 
                      value={email || ""}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Password" 
                      value={password || ""}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => setView('forgot')}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                {unverifiedEmail && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-800 space-y-2">
                    <div className="flex gap-2 items-start">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        Votre compte n'est pas encore vérifié. Veuillez cliquer sur le lien reçu par mail ou renvoyer un email.
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleResendVerification}
                      className="w-full border-amber-200 hover:bg-amber-100 text-amber-800 rounded-lg text-xs"
                      disabled={loading}
                    >
                      Renvoyer l'email de vérification
                    </Button>
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("nav.login")}
                </Button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-400">
                  © {new Date().getFullYear()} THM RENT A CAR - Gestion de Location
                </p>
              </div>
            </CardContent>
          </>
        )}

        {/* FORGOT PASSWORD VIEW */}
        {view === 'forgot' && (
          <>
            <CardHeader className="space-y-1 pt-8 text-center">
              <button 
                onClick={() => { setView('login'); setForgotSuccess(false); setDevResetToken(null); }}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-semibold text-sm mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="mx-auto bg-amber-500 p-3 rounded-2xl w-fit mb-4 shadow-lg shadow-amber-200">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Mot de passe oublié</CardTitle>
              <CardDescription className="text-slate-500">
                Saisissez votre adresse email pour recevoir un lien de réinitialisation via Gmail.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {!forgotSuccess ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                      <Input 
                        type="email" 
                        placeholder="Adresse email" 
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                        required 
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg font-semibold bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Envoyer le lien"}
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Email envoyé !</h3>
                  <p className="text-sm text-slate-500">
                    Si un compte correspond à cette adresse, vous recevrez un lien de réinitialisation sous peu.
                  </p>
                  
                  {devResetToken && (
                    <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-left space-y-2">
                      <p className="text-xs font-bold text-indigo-600 uppercase">Mode Démo / Test :</p>
                      <p className="text-xs text-slate-600">Puisque vous testez l'application, voici le lien de réinitialisation direct généré par le serveur :</p>
                      <a 
                        href={`/reset-password?token=${devResetToken}`}
                        className="text-xs text-blue-600 hover:underline break-all block font-mono"
                      >
                        {window.location.origin}/reset-password?token={devResetToken}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* RESET PASSWORD VIEW */}
        {view === 'reset' && (
          <>
            <CardHeader className="space-y-1 pt-8 text-center">
              <div className="mx-auto bg-green-600 p-3 rounded-2xl w-fit mb-4 shadow-lg shadow-green-200">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Nouveau mot de passe</CardTitle>
              <CardDescription className="text-slate-500">
                Veuillez saisir votre nouveau mot de passe sécurisé.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {!resetSuccess ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                      <Input 
                        type={showNewPassword ? "text" : "password"} 
                        placeholder="Nouveau mot de passe" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                        required 
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                      <Input 
                        type={showNewPassword ? "text" : "password"} 
                        placeholder="Confirmer le mot de passe" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                        required 
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enregistrer le mot de passe"}
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Réinitialisation réussie !</h3>
                  <p className="text-sm text-slate-500">
                    Votre mot de passe a été modifié. Redirection vers l'écran de connexion...
                  </p>
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
