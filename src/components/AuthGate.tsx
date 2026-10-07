import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AlertTriangle, LockKeyhole, RefreshCw } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export function AuthGate({ children }: { children: (session: Session) => React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <div className="center-screen">
        <AlertTriangle size={34} />
        <h1>Configuração ausente</h1>
        <p>Configure a URL e a chave pública do Supabase no ambiente de deploy.</p>
      </div>
    );
  }

  if (checking) {
    return <div className="center-screen"><RefreshCw className="spin" />Validando sessão...</div>;
  }

  if (!session) return <Login />;
  return <>{children(session)}</>;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) setError(loginError.message);
    setBusy(false);
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand"><b>G</b><div><strong>GRITaÍ</strong><span>Revenue Engine</span></div></div>
        <small className="eyebrow">ACESSO PROTEGIDO</small>
        <h1>Entre para operar receita, não listas.</h1>
        <p>Contas priorizadas, sinais, decisores e próxima melhor ação em uma única fila.</p>
        <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error ? <div className="error"><AlertTriangle size={15} />{error}</div> : null}
        <button className="primary" disabled={busy}>
          {busy ? <RefreshCw className="spin" size={17} /> : <LockKeyhole size={17} />}
          {busy ? "Validando..." : "Entrar"}
        </button>
        <small>Somente usuários autorizados.</small>
      </form>
    </div>
  );
}
