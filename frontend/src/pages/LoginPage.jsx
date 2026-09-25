import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

const DEMO_EMAIL = "ada@copperandgrain.test";
const DEMO_PASSWORD = "brew-demo-1847";

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-layout">
      <div>
        <p className="wordmark">
          Copper <span>&</span> Grain
        </p>
        <h1>Sign in</h1>
        <p className="muted">Brewing tools for the counter. One demo account is seeded with the catalog.</p>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <div className="demo-note">
          <p>Demo account</p>
          <p>
            <code>{DEMO_EMAIL}</code>
          </p>
          <p>
            <code>{DEMO_PASSWORD}</code>
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              setEmail(DEMO_EMAIL);
              setPassword(DEMO_PASSWORD);
            }}
          >
            Fill demo credentials
          </Button>
        </div>
        <label className="field">
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? (
          <p className="status bad" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Signing in" : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
