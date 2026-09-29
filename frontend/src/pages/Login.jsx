import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
const Login = () => {
  const navigate = useNavigate();
  const [email_id, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email_id: email_id,
          password: password,
        },
        {
          withCredentials: true,
        },
      );
      console.log("Login successful:", response.data);
      navigate("/");
    } catch (err) {
      console.log("Login error:", err);
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">
          C
        </div>

        <p className="eyebrow">Your AI conversations</p>

        <h1 id="login-title">Continue your chats</h1>

        <p className="auth-intro">
          Sign in to pick up where your saved conversations left off.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email address</label>

          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email_id}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="login-password">Password</label>

          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
};
export default Login;
