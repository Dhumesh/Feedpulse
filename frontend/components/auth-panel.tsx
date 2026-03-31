"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "../lib/api";

const initialLogin = {
  email: "",
  password: ""
};

const initialRegister = {
  name: "",
  email: "",
  password: ""
};

export function AuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    const token = searchParams.get("token");

    if (requestedMode === "register") {
      setMode("register");
    }

    if (!token) {
      return;
    }

    const verify = async () => {
      try {
        const response = await apiRequest<{ email: string }>("/auth/verify?token=" + token);
        setMessage({ type: "success", text: `${response.data.email} verified successfully. You can log in now.` });
        setMode("login");
      } catch (error) {
        setMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Verification failed"
        });
      }
    };

    void verify();
  }, [searchParams]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await apiRequest<{ token: string; user: { id: string; role: string; email: string; name: string } }>("/auth/login", {
        method: "POST",
        body: loginForm
      });
      window.localStorage.setItem("feedpulse-user-token", response.data.token);
      window.localStorage.setItem("feedpulse-user", JSON.stringify(response.data.user));
      setMessage({ type: "success", text: `Logged in as ${response.data.user.role}.` });
      setLoginForm(initialLogin);
      if (response.data.user.role === "admin") {
        window.localStorage.setItem("feedpulse-admin-token", response.data.token);
        router.push("/dashboard");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Login failed"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: registerForm
      });
      setMessage({
        type: "success",
        text: "Registered successfully. Check the entered email for the verification link."
      });
      setRegisterForm(initialRegister);
      setMode("login");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Registration failed"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel auth-panel">
      <div className="auth-tabs">
        <button
          type="button"
          className={mode === "login" ? "auth-tab active" : "auth-tab"}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={mode === "register" ? "auth-tab active" : "auth-tab"}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>

      <div className="section-heading">
        <span className="pill">{mode === "login" ? "Login" : "Register"}</span>
        <h2>{mode === "login" ? "Access your FeedPulse account." : "Create a new FeedPulse user."}</h2>
        <p>
          {mode === "login"
            ? "Admin users can open the dashboard. Registered users are stored in MongoDB."
            : "Registered users are saved into the User collection in MongoDB."}
        </p>
      </div>

      {mode === "login" ? (
        <form onSubmit={handleLogin} className="form-card auth-form">
          <label>
            Email
            <input
              type="email"
              value={loginForm.email}
              onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>

          {message ? <p className={`notice ${message.type}`}>{message.text}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="form-card auth-form">
          <label>
            Full name
            <input
              value={registerForm.name}
              onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={registerForm.email}
              onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={registerForm.password}
              onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>

          {message ? <p className={`notice ${message.type}`}>{message.text}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>
      )}

      <p className="auth-help">
        Admins also use the same login form. Verified users are stored in MongoDB.
      </p>
    </section>
  );
}
