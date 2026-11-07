
import { supabase } from './supabaseClient';
import React, { useState, useEffect, useRef } from 'react';
import { loginUser, registerUser } from './auth';
import CustomerDashboard from './CustomerDashboard';
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";

export default function App() {
 
  const [isLogin, setIsLogin] = useState(false);
  const [identifier, setIdentifier] = useState(''); 
  const [username, setUsername] = useState('');     
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState('');           
  const [password, setPassword] = useState('');     
  const [captchaToken, setCaptchaToken] = useState('');
  const [loading, setLoading] = useState(false);
  const turnstileRef = useRef(null);
 
  const widgetIdRef = useRef(null);
const [showDashboard, setShowDashboard] = useState(false);
const [authChecking, setAuthChecking] = useState(true);
// ==========================================
// RESTORE CUSTOMER LOGIN AFTER PAGE REFRESH
// ==========================================

useEffect(() => {
  if (window.location.pathname.startsWith("/admin")) {
    setAuthChecking(false);
    return;
  }

  let active = true;

  // Listen for login/logout and session restoration
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (!active) return;

    console.log("Auth event:", event);

    setShowDashboard(!!session?.user);
    setAuthChecking(false);
  });

  // Check existing saved session
  const restoreSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (!active) return;

      setShowDashboard(!!data?.session?.user);

    } catch (error) {
      console.error("Session restore error:", error);

      if (active) {
        setShowDashboard(false);
      }
    } finally {
      if (active) {
        setAuthChecking(false);
      }
    }
  };

  restoreSession();

  return () => {
    active = false;
    subscription.unsubscribe();
  };
}, []);


useEffect(() => {
  // Admin pages par CAPTCHA ki zaroorat nahi
  if (window.location.pathname.startsWith("/admin")) return;

  // Jab tak login/register form ready nahi, wait karein
  if (authChecking || showDashboard) return;

  let cancelled = false;

  const renderCaptcha = () => {
    if (cancelled) return;

    // CAPTCHA script ya container abhi ready nahi
    if (!window.turnstile || !turnstileRef.current) return;

    // Duplicate CAPTCHA render hone se bachayein
    if (widgetIdRef.current !== null) return;

    try {
      const id = window.turnstile.render(turnstileRef.current, {
        sitekey: "0x4AAAAAAFxqJthjLAvDDUdO",

        callback: (token) => {
          if (!cancelled) {
            setCaptchaToken(token);
            console.log("CAPTCHA verified successfully");
          }
        },

        "expired-callback": () => {
          if (!cancelled) {
            setCaptchaToken("");
          }
        },

        "error-callback": (errorCode) => {
          if (!cancelled) {
            setCaptchaToken("");
          }

          console.error("Cloudflare CAPTCHA error:", errorCode);
        },

        "timeout-callback": () => {
          if (!cancelled) {
            setCaptchaToken("");
          }
        },

        theme: "auto"
      });

      widgetIdRef.current = id;

      console.log("CAPTCHA successfully rendered:", id);

    } catch (error) {
      console.error("CAPTCHA render error:", error);
    }
  };

  // Script pehle se load ho chuki ho to foran render
  if (window.turnstile) {
    renderCaptcha();
  }

  // Script baad mein load ho to event par render
  window.addEventListener("turnstile-loaded", renderCaptcha);

  return () => {
    cancelled = true;

    window.removeEventListener("turnstile-loaded", renderCaptcha);

    if (widgetIdRef.current !== null && window.turnstile) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (error) {
        console.error("CAPTCHA cleanup error:", error);
      }

      widgetIdRef.current = null;
    }

    setCaptchaToken("");
  };

}, [authChecking, showDashboard]);


const handleAuth = async (e) => {
  e.preventDefault();

  let finalToken = captchaToken || "";

  if (
    !finalToken &&
    window.turnstile &&
    widgetIdRef.current !== null
  ) {
    try {
      finalToken =
        window.turnstile.getResponse(widgetIdRef.current) || "";
    } catch (error) {
      console.error("CAPTCHA token error:", error);
    }
  }

  if (!finalToken) {
    alert("Please complete Security Verification (CAPTCHA) and wait for the green tick!");
    return;
  }

  setLoading(true);

  try {
    if (isLogin) {
      await loginUser(identifier, password, finalToken);

      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (!data?.session?.user) {
        throw new Error("Login completed, but no active session was found.");
      }

      setShowDashboard(true);

      alert("Login successful! Welcome to TradeX Digital.");

    } else {
      const registration = await registerUser(
        username,
        email,
        password,
        finalToken,
        inviteCode
      );

      // Registration ke baad active session check
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      const activeSession =
        registration?.session || data?.session;

      if (activeSession?.user) {
        setShowDashboard(true);

        alert("Registration successful! Welcome to TradeX Digital.");

      } else {
        alert(
          "Registration successful! Please verify your email to activate your account."
        );
      }
    }

  } catch (error) {
    console.error("Authentication error:", error);
    alert(error.message || "Authentication error!");

  } finally {
    setLoading(false);
    setCaptchaToken("");

    if (
      window.turnstile &&
      widgetIdRef.current !== null
    ) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch (error) {
        console.error("CAPTCHA reset error:", error);
      }
    }
  }
};

const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";

// ADMIN ROUTES — customer dashboard se pehle
if (currentPath === "/admin/login") {
  return <AdminLogin />;
}

if (currentPath === "/admin") {
  return <AdminDashboard />;
}

// WAIT FOR SUPABASE SESSION RESTORE
if (authChecking) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#071426",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontFamily: "Arial"
      }}
    >
      Loading your account...
    </div>
  );
}

// CUSTOMER DASHBOARD
if (showDashboard) {
  return <CustomerDashboard />;
}
  return (
    <div className="page">
      <div className="globe-grid"></div>

      {/* BACKGROUND FLOATING CANDLES */}
      <div className="chart-background">
        <span className="candle" style={{ '--h': '70px' }}></span>
        <span className="candle red" style={{ '--h': '95px' }}></span>
        <span className="candle" style={{ '--h': '125px' }}></span>
        <span className="candle" style={{ '--h': '80px' }}></span>
        <span className="candle red" style={{ '--h': '105px' }}></span>
        <span className="candle" style={{ '--h': '145px' }}></span>
        <span className="candle" style={{ '--h': '115px' }}></span>
        <span className="candle red" style={{ '--h': '75px' }}></span>
        <span className="candle" style={{ '--h': '155px' }}></span>
        <span className="candle" style={{ '--h': '180px' }}></span>
        <span className="candle red" style={{ '--h': '125px' }}></span>
      </div>

      <div className="trading-floor"></div>

      {/* BRAND HEADER */}
      <header className="brand">
        <div className="brand-heading">
          <svg className="brand-trading-icon" viewBox="0 0 64 64" fill="none">
            <rect x="3" y="3" width="58" height="58" rx="16" fill="#0874ff" />
            <path d="M13 43L25 31L34 38L51 18" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M40 18H51V29" stroke="#8deaff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 50H49" stroke="#8deaff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="brand-name">Trade<span>X</span> Digital</span>
        </div>
        <div className="brand-tagline">TRADE • INVEST • GROW</div>
        <div className="brand-subtitle">Professional Forex & Cryptocurrency Trading</div>
      </header>

      {/* MAIN 3-COLUMN LAYOUT */}
      <div className="content-layout">

        {/* LEFT PANEL */}
        <aside className="side-panel left-panel">
          <div className="spot-strip">
            <div className="spot-strip-heading">
              <span className="spot-dot"></span>
              <span>BTC / USDT</span>
              <span className="spot-label">SPOT MARKET</span>
            </div>
            <div className="spot-candle-stage">
              <div className="spot-candle-grid"></div>
              <div className="spot-side-coin left">
                <span className="spot-side-logo">₿</span>
                <small>BTC</small>
              </div>

              <div className="spot-candle-row">
                <span className="spot-candle up" style={{ '--wick-top': '25%', '--wick-height': '50%', '--body-top': '35%', '--body-height': '30%' }}></span>
                <span className="spot-candle down" style={{ '--wick-top': '15%', '--wick-height': '60%', '--body-top': '25%', '--body-height': '35%' }}></span>
                <span className="spot-candle up" style={{ '--wick-top': '30%', '--wick-height': '45%', '--body-top': '40%', '--body-height': '22%' }}></span>
                <span className="spot-candle up" style={{ '--wick-top': '10%', '--wick-height': '70%', '--body-top': '20%', '--body-height': '40%' }}></span>
                <span className="spot-candle down" style={{ '--wick-top': '20%', '--wick-height': '55%', '--body-top': '30%', '--body-height': '30%' }}></span>
                <span className="spot-candle up" style={{ '--wick-top': '15%', '--wick-height': '65%', '--body-top': '25%', '--body-height': '35%' }}></span>
              </div>

              <div className="spot-side-coin right">
                <span className="spot-side-logo">₮</span>
                <small>USDT</small>
              </div>
            </div>
          </div>

          <div className="panel-box mini-chart">
            <div className="panel-heading" style={{ borderBottom: 'none', padding: '0 0 8px' }}>
              <div className="panel-heading-icon">📊</div>
              <div>
                <strong>MARKET CHART</strong>
                <small>Trading price movements</small>
              </div>
              <strong style={{ color: '#19d99b', marginLeft: 'auto', fontSize: '10px' }}>+2.48%</strong>
            </div>
            <div className="mini-candles">
              <span className="mini-candle" style={{ '--h': '45px' }}></span>
              <span className="mini-candle red" style={{ '--h': '70px' }}></span>
              <span className="mini-candle" style={{ '--h': '85px' }}></span>
              <span className="mini-candle" style={{ '--h': '60px' }}></span>
              <span className="mini-candle red" style={{ '--h': '90px' }}></span>
              <span className="mini-candle" style={{ '--h': '75px' }}></span>
            </div>
            <div className="chart-labels">
              <span>09:00</span>
              <span>12:00</span>
              <span>15:00</span>
              <span>18:00</span>
            </div>
          </div>

          <div className="trading-categories">
            <div className="trading-category">
              <div className="category-icon">⇄</div>
              <strong>FOREX TRADING</strong>
              <small>Global currency pairs</small>
            </div>
            <div className="trading-category">
              <div className="category-icon">₿</div>
              <strong>CRYPTO TRADING</strong>
              <small>Digital asset markets</small>
            </div>
          </div>

          <div className="digital-brand">
            <svg viewBox="0 0 64 64" fill="none">
              <rect x="3" y="3" width="58" height="58" rx="16" fill="#0874ff" />
              <path d="M13 43L25 31L34 38L51 18" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <strong>Digital TradeX</strong>
              <small>TRADE SMARTER • GROW FASTER</small>
            </div>
          </div>
        </aside>

      
        {/* CENTER AUTH CARD */}
        <main className="main-content">
          <div className="auth-container">
            <div className="tabs">
              <button
                type="button"
                className={`tab ${isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(true)}
              >
                👤 Login
              </button>

              <button
                type="button"
                className={`tab ${!isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(false)}
              >
                ✏️ Register
              </button>
            </div>

            <h2 className="auth-title">
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </h2>

            <div className="auth-subtitle">
              {isLogin
                ? 'Sign in using Username or Email'
                : 'Start your professional trading journey with us today.'}
            </div>

            <form onSubmit={handleAuth}>
              {isLogin ? (
                <div className="form-group">
                  <label>Username / Email</label>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input
                      type="text"
                      placeholder="Enter username or email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Username</label>
                    <div className="input-wrapper">
                      <span className="input-icon">👤</span>
                      <input
                        type="text"
                        placeholder="Choose a username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Password (Minimum 6 characters)</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔒</span>
                      <input
                        type="password"
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon">✉️</span>
                      <input
                        type="email"
                        placeholder="example@mail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* INVITATION CODE */}
                  <div className="form-group">
                    <label>Sub-Admin Invitation Code</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🎟️</span>
                      <input
                        type="text"
                        placeholder="Enter your invitation code"
                        value={inviteCode}
                        onChange={(e) =>
                          setInviteCode(e.target.value.toUpperCase())
                        }
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {isLogin && (
                <div className="form-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Cloudflare Captcha Widget Section */}
              <div
                className="captcha-heading"
                style={{ marginTop: '10px' }}
              >
                Security Verification
              </div>

              <div
                className="turnstile-container"
                style={{
                  margin: '6px 0 12px',
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <div ref={turnstileRef}></div>
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading
                  ? 'Processing...'
                  : (isLogin ? '➔ Sign In' : '+ Register Now')}
              </button>
            </form>

            <div className="toggle-text" style={{ marginTop: '12px' }}>
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}

              <span
                onClick={() => setIsLogin(!isLogin)}
                style={{ cursor: 'pointer' }}
              >
                {isLogin ? 'Create Account' : 'Login Here'}
              </span>
            </div>
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="side-panel right-panel">
          <div className="open-market-area">
            <div className="market-heading-open">
              <div>
                <strong>LIVE CRYPTO MARKETS</strong>
                <small>Professional Market Overview</small>
              </div>
              <span className="market-live-dot">● LIVE</span>
            </div>

            <div className="open-chart-section">
              <div className="open-chart-heading">
                <div className="open-chart-coin btc" style={{ background: '#f7931a' }}>₿</div>
                <div>
                  <strong>BTC / USDT</strong>
                  <small>Bitcoin</small>
                </div>
                <div className="open-chart-price">
                  <strong>$67,420.50</strong>
                  <small style={{ display: 'block' }}>+2.48%</small>
                </div>
              </div>
              <div className="professional-chart">
                <div className="chart-candles">
                  <i style={{ '--h': '35px', '--y': '10px' }}></i>
                  <i className="down" style={{ '--h': '45px', '--y': '-5px' }}></i>
                  <i style={{ '--h': '60px', '--y': '0px' }}></i>
                  <i style={{ '--h': '50px', '--y': '5px' }}></i>
                  <i style={{ '--h': '75px', '--y': '-10px' }}></i>
                  <i className="down" style={{ '--h': '40px', '--y': '10px' }}></i>
                  <i style={{ '--h': '65px', '--y': '-5px' }}></i>
                </div>
              </div>
            </div>

            <div className="open-chart-section">
              <div className="open-chart-heading">
                <div className="open-chart-coin eth" style={{ background: '#627eea' }}>Ξ</div>
                <div>
                  <strong>ETH / USDT</strong>
                  <small>Ethereum</small>
                </div>
                <div className="open-chart-price">
                  <strong style={{ color: '#ff506a' }}>$3,520.40</strong>
                  <small style={{ display: 'block', color: '#ff506a' }}>-1.25%</small>
                </div>
              </div>
              <div className="professional-chart small-chart">
                <div className="chart-candles">
                  <i className="down" style={{ '--h': '40px', '--y': '5px' }}></i>
                  <i style={{ '--h': '55px', '--y': '0px' }}></i>
                  <i className="down" style={{ '--h': '35px', '--y': '10px' }}></i>
                  <i style={{ '--h': '50px', '--y': '-5px' }}></i>
                </div>
              </div>
            </div>

            <div className="open-chart-section">
              <div className="open-chart-heading">
                <div className="open-chart-coin" style={{ background: '#6946d9' }}>≈</div>
                <div>
                  <strong>SOL / USDT</strong>
                  <small>Solana</small>
                </div>
                <div className="open-chart-price">
                  <strong>$170.25</strong>
                  <small style={{ display: 'block' }}>+3.27%</small>
                </div>
              </div>
              <div className="professional-chart small-chart">
                <div className="chart-candles">
                  <i style={{ '--h': '30px', '--y': '5px' }}></i>
                  <i style={{ '--h': '45px', '--y': '-2px' }}></i>
                  <i className="down" style={{ '--h': '25px', '--y': '8px' }}></i>
                  <i style={{ '--h': '60px', '--y': '-8px' }}></i>
                </div>
              </div>
            </div>

            <div className="open-chart-section">
              <div className="open-chart-heading">
                <div className="open-chart-coin" style={{ background: '#f3ba2f', color: '#17223b' }}>❖</div>
                <div>
<strong>BTC / USDT</strong>
                  <small>BTC</small>
                </div>
                <div className="open-chart-price">
                  <strong style={{ color: '#ff506a' }}>$598.40</strong>
                  <small style={{ display: 'block', color: '#ff506a' }}>-1.42%</small>
                </div>
              </div>
              <div className="professional-chart small-chart">
                <div className="chart-candles">
                  <i className="down" style={{ '--h': '35px', '--y': '2px' }}></i>
                  <i style={{ '--h': '40px', '--y': '-2px' }}></i>
                  <i className="down" style={{ '--h': '50px', '--y': '4px' }}></i>
                </div>
              </div>
            </div>
          </div>

          <div className="market-side-logos">
            <div className="large-market-logo btc-large">
              <span>₿</span>
              <strong>BITCOIN</strong>
              <small>BTC</small>
            </div>
            <div className="large-market-logo usdt-large">
              <span>₮</span>
              <strong>TETHER</strong>
              <small>USDT</small>
            </div>
          </div>
        </aside>

      </div>

      <footer className="features">
        <div className="feature">
          <span className="feature-icon">📊</span>
          <div><strong>Forex Trading</strong><small>Trade Major Pairs</small></div>
        </div>
        <div className="feature">
          <span className="feature-icon">₿</span>
          <div><strong>Crypto Trading</strong><small>Explore Digital Assets</small></div>
        </div>
        <div className="feature">
          <span className="feature-icon">🔒</span>
          <div><strong>Secure & Reliable</strong><small>Your Security, Our Priority</small></div>
        </div>
        <div className="feature">
          <span className="feature-icon">⚡</span>
          <div><strong>Fast Trading</strong><small>Trade Without Delay</small></div>
        </div>
      </footer>

      <div className="footer-tagline">
        TradeX Digital - Trade Smarter, Live Better 🚀
      </div>
    </div>
  );
}