
import React, { useEffect, useState, useCallback } from "react";
import "./AdminDashboard.css";

const API = "http://localhost:3000/api";

const menu = [
  { id: "overview", label: "Overview", icon: "▦" },
  { id: "customers", label: "Customers", icon: "♙" },
  { id: "deposits", label: "Deposits", icon: "↓" },
  { id: "withdrawals", label: "Withdrawals", icon: "↑" },
  { id: "trading", label: "Trading Activity", icon: "⌁" },
  { id: "subadmins", label: "Sub-admins", icon: "♧" },
  { id: "support", label: "Customer Support", icon: "☏" },
  { id: "settings", label: "Settings", icon: "⚙" }
];
// ======================================
// MAIN ADMIN SESSION HELPERS
// HTTPONLY COOKIE AUTHENTICATION
// ======================================

async function adminFetch(url, options = {}) {
  const headers = {
    ...(options.headers || {})
  };

  return fetch(url, {
    ...options,
    credentials: "include",
    headers
  });
}

// ======================================
// MAIN ADMIN DASHBOARD
// ======================================

export default function AdminDashboard() {
const [page, setPage] = useState(() => {
  const savedPage = sessionStorage.getItem("admin_dashboard_page");
  return menu.some(item => item.id === savedPage)
    ? savedPage
    : "overview";
});

useEffect(() => {
  sessionStorage.setItem("admin_dashboard_page", page);
}, [page]);

  const [admin, setAdmin] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  const [qrUploading, setQrUploading] = useState("");
  const [qrMessages, setQrMessages] = useState({});

  const [adminCurrentPassword, setAdminCurrentPassword] = useState("");
  const [adminNewEmail, setAdminNewEmail] = useState("");
  const [adminEmailOtpSent, setAdminEmailOtpSent] = useState(false);
  const [adminOldEmailOtp, setAdminOldEmailOtp] = useState("");
  const [adminNewEmailOtp, setAdminNewEmailOtp] = useState("");
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [adminPasswordOtp, setAdminPasswordOtp] = useState("");
  const [adminPasswordOtpSent, setAdminPasswordOtpSent] = useState(false);

  const [adminSecurityLoading, setAdminSecurityLoading] = useState(false);
  const [adminSecurityMessage, setAdminSecurityMessage] = useState("");
const [settingsView, setSettingsView] = useState("home");

const [mainInviteCode, setMainInviteCode] = useState("");
const [inviteCodeLoading, setInviteCodeLoading] = useState(false);
const [inviteCodeSaving, setInviteCodeSaving] = useState(false);
const [inviteCodeMessage, setInviteCodeMessage] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceType, setBalanceType] = useState("add");


  // SUB-ADMIN MANAGEMENT
  const [subAdmins, setSubAdmins] = useState([]);
  const [subAdminEmail, setSubAdminEmail] = useState("");
  const [subAdminPassword, setSubAdminPassword] = useState("");
  const [subAdminLoading, setSubAdminLoading] = useState(false);
  const [subAdminSaving, setSubAdminSaving] = useState(false);
  const [subAdminMessage, setSubAdminMessage] = useState("");


  // PLATFORM SETTINGS
  const [platformSettings, setPlatformSettings] = useState({
    trc20_address: "",
    btc_address: "",
    eth_address: "",
    telegram_link: "",
    whatsapp_link: "",
    trc20_qr_url: "",
    btc_qr_url: "",
    eth_qr_url: ""
  });

  const [p2pOrders, setP2pOrders] = useState([]);
  const [platformLoading, setPlatformLoading] = useState(false);
  const [platformSaving, setPlatformSaving] = useState("");

  // ======================================
  // API REQUEST HELPER
  // KEEP THIS HELPER
  // ======================================

  async function apiRequest(endpoint, options = {}) {
    const headers = {
      ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] =
        headers["Content-Type"] || "application/json";
    }

    const response = await adminFetch(`${API}${endpoint}`, {
      ...options,
      headers
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message || `Request failed: ${response.status}`
      );
    }

    return result;
  }

// ======================================
// MAIN ADMIN INVITATION CODE
// ======================================

async function loadMainInviteCode() {
  try {
    setInviteCodeLoading(true);
    setInviteCodeMessage("");

    const result = await apiRequest("/admin/invitation-code");

    setMainInviteCode(result.invite_code || "");
  } catch (err) {
    console.error("Load invitation code error:", err);
    setInviteCodeMessage(err.message || "Could not load invitation code.");
  } finally {
    setInviteCodeLoading(false);
  }
}


async function saveMainInviteCode() {
  const code = mainInviteCode.trim().toUpperCase();

  if (!code) {
    setInviteCodeMessage("Please enter an invitation code.");
    return;
  }

  try {
    setInviteCodeSaving(true);
    setInviteCodeMessage("");

    const result = await apiRequest("/admin/invitation-code", {
      method: "PUT",
      body: JSON.stringify({
        invite_code: code
      })
    });

    setMainInviteCode(result.invite_code || code);

    setInviteCodeMessage(
      result.message || "Invitation code updated successfully."
    );

  } catch (err) {
    console.error("Save invitation code error:", err);
    setInviteCodeMessage(
      err.message || "Could not save invitation code."
    );
  } finally {
    setInviteCodeSaving(false);
  }
}

  // ======================================
  // LOAD PLATFORM SETTINGS
  // ======================================

  async function loadPlatformSettings() {
    try {
      const result = await apiRequest("/admin/platform-settings");
      const data = result.settings || result.data || result;

      setPlatformSettings(current => ({
        ...current,
        trc20_address: data.trc20_address || "",
        btc_address: data.btc_address || "",
        eth_address: data.eth_address || "",
        telegram_link: data.telegram_link || "",
        whatsapp_link: data.whatsapp_link || "",
        trc20_qr_url: data.trc20_qr_url || "",
        btc_qr_url: data.btc_qr_url || "",
        eth_qr_url: data.eth_qr_url || ""
      }));

      return true;
    } catch (err) {
      console.error("Platform settings load error:", err);
      throw err;
    }
  }

  // ======================================
  // SAVE ONE PLATFORM SETTING
  // ======================================

  async function savePlatformSetting(key) {
    setPlatformSaving(key);

    try {
      await apiRequest("/admin/platform-settings", {
        method: "PUT",
        body: JSON.stringify({
          [key]: platformSettings[key]
        })
      });

      alert("Setting successfully updated.");
    } catch (err) {
      alert(err.message);
    } finally {
      setPlatformSaving("");
    }
  }

  // ======================================
  // LOAD P2P ORDERS
  // ======================================

  async function loadP2pOrders() {
    try {
      const result = await apiRequest("/admin/p2p-orders");

      setP2pOrders(
        result.orders ||
        result.data?.orders ||
        result.data ||
        []
      );

      return true;
    } catch (err) {
      console.error("P2P orders load error:", err);
      throw err;
    }
  }

  // ======================================
  // UPDATE P2P ORDER STATUS
  // ======================================

  async function updateP2pStatus(orderId, status) {
    if (
      status === "completed" &&
      !window.confirm(
        "Kya aap customer ki payment verify kar chuke hain? Sirf verified payment par order complete karein."
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/admin/p2p-orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });

      alert("P2P order status updated.");
      await loadP2pOrders();
    } catch (err) {
      alert(err.message);
    }
  }

  // ======================================
  // UPLOAD WALLET QR
  // ======================================

  const uploadWalletQr = async (asset, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("qr", file);

    setQrUploading(asset);

    setQrMessages(current => ({
      ...current,
      [asset]: ""
    }));

    try {
      const response = await adminFetch(
        `${API}/admin/platform-settings/qr/${asset}`,
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.message || "QR upload failed.");
      }

      const qrKey = `${asset}_qr_url`;

      setPlatformSettings(current => ({
        ...current,
        [qrKey]: result.settings?.[qrKey] || ""
      }));

      setQrMessages(current => ({
        ...current,
        [asset]: "QR image uploaded successfully."
      }));
    } catch (err) {
      setQrMessages(current => ({
        ...current,
        [asset]: err.message
      }));
    } finally {
      setQrUploading("");
    }
  };

  const deleteWalletQr = async (asset) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete the ${asset.toUpperCase()} QR code?`
  );

  if (!confirmed) return;

  try {
    setQrUploading(asset);

const response = await adminFetch(
        `${API}/admin/platform-settings/qr/${asset}`,
      {
        method: "DELETE",
      
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Could not delete QR image."
      );
    }

    setPlatformSettings(result.settings);

    setQrMessages(current => ({
      ...current,
      [asset]: "QR image deleted successfully."
    }));

  } catch (error) {
    setQrMessages(current => ({
      ...current,
      [asset]: error.message || "Could not delete QR image."
    }));
  } finally {
    setQrUploading(null);
  }
};
  // ======================================
  // FAST DASHBOARD LOADING
  // SESSION FIRST, DATA IN BACKGROUND
  // ======================================

  const loadDashboard = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }

    setRefreshing(true);
    setError("");

    try {
      // STEP 1: VERIFY ADMIN SESSION
      const me = await apiRequest("/admin/me");

      setAdmin(me.admin || me.data || me);

      // SHOW DASHBOARD IMMEDIATELY
      // DO NOT WAIT FOR ALL DATA
      setLoading(false);

      // STEP 2: LOAD ALL DATA IN BACKGROUND
      const results = await Promise.allSettled([
        apiRequest("/admin/customers?page=1&limit=100"),
        apiRequest("/admin/deposits"),
        apiRequest("/admin/withdrawals"),
        apiRequest("/admin/platform-settings"),
        apiRequest("/admin/p2p-orders")
      ]);

      // CUSTOMERS
      if (results[0].status === "fulfilled") {
        const result = results[0].value;

        setCustomers(
          result.customers ||
          result.data?.customers ||
          result.data ||
          []
        );
      } else {
        console.error("Customers load error:", results[0].reason);
      }

      // DEPOSITS
      if (results[1].status === "fulfilled") {
        const result = results[1].value;

        setDeposits(
          result.deposits ||
          result.data?.deposits ||
          result.data ||
          []
        );
      } else {
        console.error("Deposits load error:", results[1].reason);
      }

      // WITHDRAWALS
      if (results[2].status === "fulfilled") {
        const result = results[2].value;

        setWithdrawals(
          result.withdrawals ||
          result.data?.withdrawals ||
          result.data ||
          []
        );
      } else {
        console.error("Withdrawals load error:", results[2].reason);
      }

      // PLATFORM SETTINGS
      if (results[3].status === "fulfilled") {
        const result = results[3].value;
        const data = result.settings || result.data || result;

        setPlatformSettings(current => ({
          ...current,
          trc20_address: data.trc20_address || "",
          btc_address: data.btc_address || "",
          eth_address: data.eth_address || "",
          telegram_link: data.telegram_link || "",
          whatsapp_link: data.whatsapp_link || "",
          trc20_qr_url: data.trc20_qr_url || "",
          btc_qr_url: data.btc_qr_url || "",
          eth_qr_url: data.eth_qr_url || ""
        }));
      } else {
        console.error("Platform settings load error:", results[3].reason);
      }

      // P2P ORDERS
      if (results[4].status === "fulfilled") {
        const result = results[4].value;

        setP2pOrders(
          result.orders ||
          result.data?.orders ||
          result.data ||
          []
        );
      } else {
        console.error("P2P orders load error:", results[4].reason);
      }

    } catch (err) {
      setError(err.message);

      const message = String(err.message || "").toLowerCase();

      if (
        message.includes("admin login") ||
        message.includes("admin session") ||
        message.includes("unauthorized") ||
        message.includes("invalid token") ||
        message.includes("expired")
      ) {
        window.location.replace("/admin/login");
      }

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

useEffect(() => {
  if (page === "subadmins" && admin?.role === "main_admin") {
    console.log("SUBADMIN API CALL STARTED");

    loadSubAdmins();
  }
}, [page, admin?.role]);

useEffect(() => {
  console.log("CURRENT PAGE:", page);
  console.log("CURRENT ADMIN:", admin);
  console.log("ADMIN ROLE:", admin?.role);
}, [page, admin]);
  // ======================================
  // INITIAL DASHBOARD LOAD
  // ======================================

  useEffect(() => {
    loadDashboard(true);
  }, [loadDashboard]);


// ======================================
// AUTO REFRESH ALL ADMIN DATA
// EVERY 15 SECONDS
// ======================================

useEffect(() => {
  const refreshInterval = setInterval(() => {
    if (document.visibilityState === "visible") {
      loadDashboard(false);
    }
  }, 25000);

  return () => clearInterval(refreshInterval);
}, [loadDashboard]);

  // ======================================
  // LOGOUT
  // REVOKE DATABASE SESSION + COOKIE
  // ======================================

  async function logout() {
    try {
      const response = await fetch(`${API}/admin/logout`, {
        method: "POST",
        credentials: "include"
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Logout failed.");
      }

    } catch (err) {
      console.error("Admin logout error:", err);
    } finally {
      window.location.replace("/admin/login");
    }
  }


  // ======================================
  // CUSTOMER MODALS
  // ======================================

  function openCustomer(customer) {
    setSelectedCustomer(customer);

    setModal(
      customer.__view === "activity"
        ? "customer-activity"
        : "customer"
    );
  }

  function openBalance(customer, type) {
    setSelectedCustomer(customer);
    setBalanceType(type);
    setBalanceAmount("");
    setModal("balance");
  }

  // ======================================
  // SUBMIT CUSTOMER BALANCE
  // ======================================

  async function submitBalance() {
    if (
      !selectedCustomer ||
      !balanceAmount ||
      Number(balanceAmount) <= 0
    ) {
      alert("Valid amount enter karein.");
      return;
    }

    try {
      await apiRequest(
        `/admin/customers/${selectedCustomer.id}/balance`,
        {
          method: "POST",
          body: JSON.stringify({
            action: balanceType,
            amount: Number(balanceAmount)
          })
        }
      );

      alert("Balance update request successful.");

      setModal(null);
      await loadDashboard(false);
    } catch (err) {
      alert(err.message);
    }
  }


  // ======================================
  // LOAD SUB-ADMINS
  // ======================================

  async function loadSubAdmins() {
    if (admin?.role !== "main_admin") return;

    setSubAdminLoading(true);
    setSubAdminMessage("");

    try {
      const result = await apiRequest("/admin/subadmins");
setSubAdmins(result.subAdmins || []);
    } catch (err) {
      setSubAdminMessage(err.message);
    } finally {
      setSubAdminLoading(false);
    }
  }

  // ======================================
  // CREATE SUB-ADMIN
  // ======================================

  async function createSubAdmin() {
    if (!subAdminEmail.trim() || !subAdminPassword) {
      setSubAdminMessage("Enter Sub-Admin email and password.");
      return;
    }

    if (subAdminPassword.length < 8) {
      setSubAdminMessage("Password must be at least 8 characters.");
      return;
    }

    setSubAdminSaving(true);
    setSubAdminMessage("");

    try {
      const result = await apiRequest("/admin/subadmins", {
        method: "POST",
        body: JSON.stringify({
          email: subAdminEmail.trim().toLowerCase(),
          password: subAdminPassword
        })
      });

      setSubAdminEmail("");
      setSubAdminPassword("");

      setSubAdminMessage(
        result.message || "Sub-Admin created successfully."
      );

      await loadSubAdmins();
    } catch (err) {
      setSubAdminMessage(err.message);
    } finally {
      setSubAdminSaving(false);
    }
  }

  // ======================================
  // ENABLE / DISABLE SUB-ADMIN
  // ======================================

  async function toggleSubAdmin(id, currentStatus) {
    if (
      !window.confirm(
        currentStatus
          ? "Disable this Sub-Admin?"
          : "Enable this Sub-Admin?"
      )
    ) return;

    try {
      await apiRequest(`/admin/subadmins/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });

      setSubAdminMessage("Sub-Admin status updated.");
      await loadSubAdmins();
    } catch (err) {
      setSubAdminMessage(err.message);
    }
  }


  // ======================================
  // CUSTOMER FILTER
  // ======================================

  const filteredCustomers = customers.filter(customer => {
    const query = search.toLowerCase();

    return (
      String(customer.username || "").toLowerCase().includes(query) ||
      String(customer.email || "").toLowerCase().includes(query) ||
      String(customer.id || "").toLowerCase().includes(query) ||
      String(customer.custom_id || "").toLowerCase().includes(query)
    );
  });

  const activeCount = customers.filter(
    c => c.is_active !== false && c.status !== "frozen"
  ).length;

  const frozenCount = customers.filter(
    c => c.status === "frozen" || c.is_active === false
  ).length;

  // ======================================
  // FORMAT MONEY
  // ======================================

  const money = value =>
    "$" + Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  // ======================================
  // SMALL UI COMPONENTS
  // ======================================

  function Stat({ label, value, icon, color = "blue" }) {
    return (
      <div className="ad-stat">
        <div>
          <span className="ad-stat-label">{label}</span>
          <h2>{value}</h2>
        </div>

        <div className={`ad-stat-icon ${color}`}>
          {icon}
        </div>
      </div>
    );
  }

  function Empty({ text }) {
    return (
      <div className="ad-empty">
        <span>▤</span>
        <p>{text}</p>
      </div>
    );
  }

  function Status({ value }) {
    const status = String(value || "pending").toLowerCase();

    return (
      <span className={`ad-status ${status}`}>
        {status}
      </span>
    );
  }

  // ======================================
  // ADMIN SECURITY REQUEST
  // ======================================

  async function adminSecurityRequest(endpoint, body) {
    const response = await adminFetch(`${API}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Security request failed.");
    }

    return data;
  }

  // ======================================
  // REQUEST EMAIL OTP
  // ======================================

  async function requestAdminEmailOtp() {
    try {
      setAdminSecurityLoading(true);
      setAdminSecurityMessage("");

      if (!adminCurrentPassword || !adminNewEmail.trim()) {
        throw new Error("Current password and new email are required.");
      }

      const data = await adminSecurityRequest(
        "/admin/security/email/request",
        {
          currentPassword: adminCurrentPassword,
          newEmail: adminNewEmail.trim()
        }
      );

      setAdminEmailOtpSent(true);
      setAdminSecurityMessage(data.message || "OTP sent successfully.");
    } catch (err) {
      setAdminSecurityMessage(err.message);
    } finally {
      setAdminSecurityLoading(false);
    }
  }

  // ======================================
  // VERIFY BOTH EMAIL OTPS
  // ======================================

  async function verifyAdminEmailOtp() {
    try {
      setAdminSecurityLoading(true);
      setAdminSecurityMessage("");

      if (!adminOldEmailOtp || !adminNewEmailOtp) {
        throw new Error("Enter both email verification codes.");
      }

      const data = await adminSecurityRequest(
        "/admin/security/email/verify",
        {
          oldCode: adminOldEmailOtp.trim(),
          newCode: adminNewEmailOtp.trim(),
          newEmail: adminNewEmail.trim()
        }
      );

      setAdminSecurityMessage(
        data.message || "Admin email updated successfully."
      );

      // Old sessions must be revoked by backend.
    window.location.replace("/admin/login");
    
    } catch (err) {
      setAdminSecurityMessage(err.message);
    } finally {
      setAdminSecurityLoading(false);
    }
  }

  // ======================================
  // REQUEST PASSWORD OTP
  // ======================================

  async function requestAdminPasswordOtp() {
    try {
      setAdminSecurityLoading(true);
      setAdminSecurityMessage("");

      if (!adminCurrentPassword || !adminNewPassword) {
        throw new Error("Enter your current and new password.");
      }

      if (adminNewPassword.length < 8) {
        throw new Error("New password must be at least 8 characters.");
      }

      if (adminNewPassword !== adminConfirmPassword) {
        throw new Error("New passwords do not match.");
      }

      const data = await adminSecurityRequest(
        "/admin/security/password/request",
        {
          currentPassword: adminCurrentPassword,
          newPassword: adminNewPassword
        }
      );

      setAdminPasswordOtpSent(true);
      setAdminSecurityMessage(data.message || "Password OTP sent.");
    } catch (err) {
      setAdminSecurityMessage(err.message);
    } finally {
      setAdminSecurityLoading(false);
    }
  }

  // ======================================
  // VERIFY PASSWORD OTP
  // ======================================

  async function verifyAdminPasswordOtp() {
    try {
      setAdminSecurityLoading(true);
      setAdminSecurityMessage("");

      if (!adminPasswordOtp.trim()) {
        throw new Error("Enter the email verification code.");
      }

      if (adminNewPassword !== adminConfirmPassword) {
        throw new Error("New passwords do not match.");
      }

      const data = await adminSecurityRequest(
        "/admin/security/password/verify",
        {
          code: adminPasswordOtp.trim(),
          newPassword: adminNewPassword
        }
      );

      setAdminSecurityMessage(
        data.message || "Admin password updated successfully."
      );

      // Old sessions must be revoked by backend.
    window.location.replace("/admin/login");
    } catch (err) {
      setAdminSecurityMessage(err.message);
    } finally {
      setAdminSecurityLoading(false);
    }
  }

  // ======================================
  // MAIN RENDER
  // ======================================

  return (
    <div className="ad-layout">
      <aside className="ad-sidebar">
        <div className="ad-brand">
          <div className="ad-brand-icon"></div>
          <div>
            <strong>TradeX Digial</strong>
            <small>MAIN ADMIN PANEL</small>
          </div>
        </div>

        <div className="ad-menu-title">MAIN MENU</div>

        <nav className="ad-nav">
          {menu.map(item => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => setPage(item.id)}
            >
              <span className="ad-nav-icon">{item.icon}</span>
              {item.label}
              {page === item.id && <span className="ad-nav-active" />}
            </button>
          ))}
        </nav>

        <div className="ad-sidebar-bottom">
          <div className="ad-admin-mini">
            <div className="ad-avatar">A</div>
            <div>
              <strong>{admin?.email || "Main Admin"}</strong>
              <small>Main Administrator</small>
            </div>
          </div>

          <button className="ad-logout" onClick={logout}>
            ↪ Logout
          </button>
        </div>
      </aside>

      <main className="ad-main">
        <header className="ad-topbar">
          <div>
            <h1>
              {menu.find(item => item.id === page)?.label || "Overview"}
            </h1>
            <p>Welcome to your TradeX administration panel.</p>
          </div>

          <div className="ad-top-actions">
            <span className="ad-online">
              <i /> System Online
            </span>

            <button
              className="ad-refresh"
              onClick={() => loadDashboard(false)}
              disabled={refreshing}
            >
              {refreshing ? "↻ Loading..." : "↻ Refresh"}
            </button>
          </div>
        </header>

        {error && (
          <div className="ad-error">
            <strong>Dashboard connection:</strong> {error}
            <button onClick={() => loadDashboard(true)}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="ad-loading">
            Loading admin dashboard...
          </div>
        ) : (
          <>
            {/* ======================================
                OVERVIEW
            ====================================== */}

            {page === "overview" && (
              <>
                <div className="ad-welcome">
                  <div>
                    <span>MAIN ADMINISTRATION</span>
                    <h2>Dashboard Overview</h2>
                    <p>
                      Monitor your platform, customers and account activity.
                    </p>
                  </div>

                  <div className="ad-welcome-icon">⌘</div>
                </div>

                <div className="ad-stats-grid">
                  <Stat label="Total Customers" value={customers.length} icon="♙" />
                  <Stat label="Active Customers" value={activeCount} icon="✓" color="green" />
                  <Stat label="Frozen / Disabled" value={frozenCount} icon="⊘" color="red" />
                  <Stat label="Total Deposits" value={deposits.length} icon="↓" color="purple" />
                  <Stat
                    label="Pending Withdrawals"
                    value={withdrawals.filter(x => x.status === "pending").length}
                    icon="↑"
                    color="orange"
                  />
                  <Stat label="Trading Records" value="—" icon="⌁" color="cyan" />
                </div>

                <div className="ad-two-grid">
                  <section className="ad-panel">
                    <h3>Platform Status</h3>

                    <div className="ad-status-row">
                      <span>Admin Session</span>
                      <Status value={admin ? "active" : "disabled"} />
                    </div>

                    <div className="ad-status-row">
                      <span>Customer API</span>
                      <Status value={error ? "offline" : "active"} />
                    </div>

                    <div className="ad-status-row">
                      <span>Deposit Records</span>
                      <strong>{deposits.length}</strong>
                    </div>
                  </section>

                  <section className="ad-panel">
                    <h3>Admin Account</h3>
                    <p className="ad-muted">{admin?.email || "Main Admin"}</p>
                    <p className="ad-muted">Role: {admin?.role || "Main Admin"}</p>

                    <button
                      className="ad-outline-btn"
                      onClick={() => setPage("settings")}
                    >
                      Account Settings
                    </button>
                  </section>
                </div>
              </>
            )}

            {/* ======================================
                CUSTOMERS
            ====================================== */}

            {page === "customers" && (
              <>
                <div className="ad-stats-grid three">
                  <Stat label="Total Customers" value={customers.length} icon="♙" />
                  <Stat label="Active Customers" value={activeCount} icon="✓" color="green" />
                  <Stat label="Frozen / Disabled" value={frozenCount} icon="⊘" color="red" />
                </div>

                <section className="ad-panel">
                  <div className="ad-panel-heading">
                    <div>
                      <h3>Customer Management</h3>
                      <p>Manage accounts, balances and customer settings.</p>
                    </div>

                    <input
                      className="ad-search"
                      placeholder="Search customer..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>

                  <CustomerTable
                    rows={filteredCustomers}
                    money={money}
                    openBalance={openBalance}
                    openCustomer={openCustomer}
                  />
                </section>
              </>
            )}

            {/* ======================================
                DEPOSITS
            ====================================== */}

            {page === "deposits" && (
              <section className="ad-panel">
                <div className="ad-panel-heading">
                  <div>
                    <h3>Deposit Management</h3>
                    <p>Review customer deposit requests.</p>
                  </div>

                  <button
                    className="ad-outline-btn"
                    onClick={() => loadDashboard(false)}
                  >
                    Refresh
                  </button>
                </div>

                <div className="ad-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Customer ID</th>
                        <th>Asset</th>
                        <th>Network</th>
                        <th>Amount (USD)</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {deposits.map(item => (
                        <tr key={item.id}>
                          <td>{item.user_id}</td>
                          <td>{item.asset}</td>
                          <td>{item.network}</td>
                          <td>{money(item.amount_usdt)}</td>
                          <td><Status value={item.status} /></td>
                          <td>
                            {item.created_at
                              ? new Date(item.created_at).toLocaleDateString()
                              : "—"}
                          </td>
                          <td>
                            <button
                              className="ad-small-btn"
                              onClick={() =>
                                alert("Deposit review API abhi connect nahi hai.")
                              }
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {deposits.length === 0 && (
                    <Empty text="No deposit records loaded. Deposit API connection required." />
                  )}
                </div>
              </section>
            )}

            {/* ======================================
                WITHDRAWALS
            ====================================== */}

            {page === "withdrawals" && (
              <section className="ad-panel">
                <div className="ad-panel-heading">
                  <div>
                    <h3>Withdrawal Management</h3>
                    <p>Review and manage withdrawal requests.</p>
                  </div>

                  <button
                    className="ad-outline-btn"
                    onClick={() => loadDashboard(false)}
                  >
                    Refresh
                  </button>
                </div>

                <div className="ad-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Network</th>
                        <th>Wallet Address</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {withdrawals.map(item => (
                        <tr key={item.id}>
                          <td>{item.user_id}</td>
                          <td>{money(item.amount)}</td>
                          <td>{item.network}</td>
                          <td className="ad-address">
                            {item.wallet_address || "—"}
                          </td>
                          <td><Status value={item.status} /></td>
                          <td>
                            {item.created_at
                              ? new Date(item.created_at).toLocaleDateString()
                              : "—"}
                          </td>
                          <td>
                            <button
                              className="ad-small-btn"
                              onClick={() =>
                                alert("Withdrawal review API abhi connect nahi hai.")
                              }
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {withdrawals.length === 0 && (
                    <Empty text="No withdrawal records loaded. Withdrawal API connection required." />
                  )}
                </div>
              </section>
            )}

            {/* ======================================
                TRADING ACTIVITY
            ====================================== */}

            {page === "trading" && (
              <>
                <div className="ad-welcome">
                  <div>
                    <span>SIMULATED TRADING MANAGEMENT</span>
                    <h2>Trading Activity</h2>
                    <p>
                      Manage simulated trading rules using market reference prices.
                    </p>
                  </div>

                  <div className="ad-welcome-icon">⌁</div>
                </div>

                <div className="ad-stats-grid">
                  <Stat label="Total Trades" value="—" icon="⌁" />
                  <Stat label="Open Positions" value="—" icon="◷" color="green" />
                  <Stat label="Closed Trades" value="—" icon="✓" color="purple" />
                  <Stat label="Total P/L" value="—" icon="$" color="orange" />
                </div>

                <section className="ad-panel">
                  <h3>Market Management</h3>
                  <p className="ad-muted">
                    Live market prices and market controls.
                  </p>
                  <Empty text="Market API and trading rules endpoint are not connected yet." />
                </section>

                <section className="ad-panel">
                  <h3>Customer Trading Controls</h3>
                  <p className="ad-muted">
                    Manage individual customer trading permissions.
                  </p>

                  <CustomerTable
                    rows={filteredCustomers}
                    money={money}
                    openBalance={openBalance}
                    openCustomer={openCustomer}
                  />
                </section>

                <div className="ad-two-grid">
                  <section className="ad-panel">
                    <h3>Open Positions</h3>
                    <Empty text="No open positions API connected." />
                  </section>

                  <section className="ad-panel">
                    <h3>Trade History</h3>
                    <Empty text="No trade history API connected." />
                  </section>

                  <section className="ad-panel">
                    <h3>Profit / Loss Management</h3>
                    <Empty text="P/L management API not connected." />
                  </section>

                  <section className="ad-panel">
                    <h3>Risk Controls</h3>
                    <Empty text="Risk control settings API not connected." />
                  </section>
                </div>
              </>
            )}

            {/* ======================================
                SUB-ADMINS
            ====================================== */}

{page === "subadmins" && (
  <section className="ad-panel">
    <div className="ad-panel-heading">
      <div>
        <h3>Sub-admin Management</h3>
        <p>Create and manage your Sub-Admin accounts and invitation codes.</p>
      </div>

      <button
        className="ad-outline-btn"
        onClick={loadSubAdmins}
        disabled={subAdminLoading}
      >
        {subAdminLoading ? "Loading..." : "Refresh"}
      </button>
    </div>

    {admin?.role === "main_admin" ? (
      <>
        <div className="ad-setting-field">
          <label>Sub-Admin Email</label>
          <input
            type="email"
            placeholder="Enter Sub-Admin email"
            value={subAdminEmail}
            onChange={e => setSubAdminEmail(e.target.value)}
          />

          <label>Sub-Admin Password</label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            value={subAdminPassword}
            onChange={e => setSubAdminPassword(e.target.value)}
          />

          <button
            className="ad-primary-btn"
            disabled={subAdminSaving}
            onClick={createSubAdmin}
          >
            {subAdminSaving ? "Creating..." : "Create Sub-Admin"}
          </button>
        </div>

        {subAdminMessage && (
          <div className="ad-notice">{subAdminMessage}</div>
        )}

        <div className="ad-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Invite Code</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {subAdmins.map(item => (
                <tr key={item.id}>
                  <td>{item.email}</td>

                  <td>
                    <strong>{item.invite_code || "—"}</strong>

                    {item.invite_code && (
                      <button
                        className="ad-small-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(item.invite_code);
                          alert("Invite Code copied.");
                        }}
                      >
                        Copy
                      </button>
                    )}
                  </td>

                  <td>
                    <Status value={item.is_active ? "active" : "disabled"} />
                  </td>

                  <td>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString()
                      : "—"}
                  </td>

                  <td>
                    <button
                      className="ad-small-btn"
                      onClick={() =>
                        toggleSubAdmin(item.id, item.is_active)
                      }
                    >
                      {item.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!subAdminLoading && subAdmins.length === 0 && (
            <Empty text="No Sub-Admin accounts found." />
          )}
        </div>
      </>
    ) : (
      <p className="ad-muted">
        Sub-Admin management is only available to the Main Admin.
      </p>
    )}
  </section>
)}

            {/* ======================================
                CUSTOMER SUPPORT
            ====================================== */}

            {page === "support" && (
              <>
                <section className="ad-panel">
                  <div className="ad-panel-heading">
                    <div>
                      <h3>Customer Support Links</h3>
                      <p>Manage Telegram and WhatsApp support links.</p>
                    </div>
                  </div>

                  <div className="ad-setting-field">
                    <label>Telegram Support Link</label>

                    <input
                      type="text"
                      placeholder="https://t.me/yourusername"
                      value={platformSettings.telegram_link}
                      onChange={e =>
                        setPlatformSettings(current => ({
                          ...current,
                          telegram_link: e.target.value
                        }))
                      }
                    />

                    <button
                      className="ad-primary-btn"
                      disabled={!!platformSaving || platformLoading}
                      onClick={() => savePlatformSetting("telegram_link")}
                    >
                      {platformSaving === "telegram_link"
                        ? "Updating..."
                        : "Update Telegram"}
                    </button>
                  </div>

                  <div className="ad-setting-field">
                    <label>WhatsApp Support Link</label>

                    <input
                      type="text"
                      placeholder="https://wa.me/..."
                      value={platformSettings.whatsapp_link}
                      onChange={e =>
                        setPlatformSettings(current => ({
                          ...current,
                          whatsapp_link: e.target.value
                        }))
                      }
                    />

                    <button
                      className="ad-primary-btn"
                      disabled={!!platformSaving || platformLoading}
                      onClick={() => savePlatformSetting("whatsapp_link")}
                    >
                      {platformSaving === "whatsapp_link"
                        ? "Updating..."
                        : "Update WhatsApp"}
                    </button>
                  </div>
                </section>

                <section className="ad-panel">
                  <div className="ad-panel-heading">
                    <div>
                      <h3>P2P Order Management</h3>
                      <p>
                        Customers must contact support and complete manual verification.
                      </p>
                    </div>

                    <button
                      className="ad-outline-btn"
                      onClick={loadP2pOrders}
                    >
                      Refresh Orders
                    </button>
                  </div>

                  <div className="ad-notice">
                    Payment verify kiye baghair order Complete na karein.
                    Customer balance is status update se automatically change nahi hoga.
                  </div>

                  <div className="ad-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Customer ID</th>
                          <th>Order Type</th>
                          <th>Asset</th>
                          <th>Amount</th>
                          <th>Contact</th>
                          <th>Message</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {p2pOrders.map(order => (
                          <tr key={order.id}>
                            <td>{order.customer_id}</td>
                            <td>
                              {String(order.order_type || "").toUpperCase()}
                            </td>
                            <td>{order.asset || "USDT"}</td>
                            <td>
                              {Number(order.amount || 0).toLocaleString()}
                            </td>
                            <td>{order.contact_channel || "—"}</td>
                            <td>{order.customer_message || "—"}</td>
                            <td><Status value={order.status} /></td>
                            <td>
                              {order.created_at
                                ? new Date(order.created_at).toLocaleString()
                                : "—"}
                            </td>
                            <td>
                              <div className="ad-customer-actions">
                                {order.status === "pending" && (
                                  <button
                                    className="ad-small-btn"
                                    onClick={() =>
                                      updateP2pStatus(order.id, "contacted")
                                    }
                                  >
                                    Contacted
                                  </button>
                                )}

                                {(order.status === "pending" ||
                                  order.status === "contacted") && (
                                  <>
                                    <button
                                      className="ad-small-btn"
                                      onClick={() =>
                                        updateP2pStatus(order.id, "completed")
                                      }
                                    >
                                      Complete
                                    </button>

                                    <button
                                      className="ad-small-btn"
                                      onClick={() =>
                                        updateP2pStatus(order.id, "rejected")
                                      }
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {p2pOrders.length === 0 && (
                      <Empty text="No P2P orders found." />
                    )}
                  </div>
                </section>
              </>
            )}

          {/* ======================================
    SETTINGS
====================================== */}

{page === "settings" && (
  <>
    {/* ======================================
        SETTINGS HOME — TWO CARDS
    ====================================== */}
    {settingsView === "home" && (
      <div className="ad-settings-home">

        <button
          type="button"
          className="ad-settings-card"
          onClick={() => {
            setSettingsView("admin");
            loadMainInviteCode();
          }}
        >
          <div className="ad-settings-card-icon">👤</div>

          <div className="ad-settings-card-content">
            <h3>Main Admin Settings</h3>

            <p>
              Manage admin email, password, security and invitation code.
            </p>

            <span>Open Settings →</span>
          </div>
        </button>


        <button
          type="button"
          className="ad-settings-card"
          onClick={() => {
            setSettingsView("wallet");
            loadPlatformSettings();
          }}
        >
          <div className="ad-settings-card-icon">💳</div>

          <div className="ad-settings-card-content">
            <h3>Wallet & QR Settings</h3>

            <p>
              Manage TRC20, BTC, ETH addresses and QR images.
            </p>

            <span>Open Settings →</span>
          </div>
        </button>

      </div>
    )}

{/* ======================================
    MAIN ADMIN SETTINGS PAGE
====================================== */}
{settingsView === "admin" && (
  <section className="ad-settings-page">

    {/* BACK BUTTON */}
    <button
      type="button"
      className="ad-back-btn"
      onClick={() => setSettingsView("home")}
    >
      ← Back to Settings
    </button>


    {/* ======================================
        MAIN ADMIN SUMMARY
    ====================================== */}
    <section className="ad-main-summary-card">

      <div className="ad-main-summary-top">

        <div>
          <h2>Main Admin Settings</h2>

          <p className="ad-muted">
            Manage your administrator account and security.
          </p>
        </div>

        <div className="ad-main-active-badge">
          <span></span>
          Active
        </div>

      </div>


      <div className="ad-admin-info-grid">

        <div className="ad-admin-info-card">
          <span>Current Admin Email</span>
          <strong>{admin?.email || "—"}</strong>
        </div>

        <div className="ad-admin-info-card">
          <span>Admin Role</span>
          <strong>{admin?.role || "Main Admin"}</strong>
        </div>

        <div className="ad-admin-info-card">
          <span>Session Status</span>

          <strong className="ad-session-green">
            ● {admin ? "Active" : "Disabled"}
          </strong>
        </div>

      </div>

    </section>


    {/* ======================================
        THREE CARDS IN ONE LINE
        LEFT: INVITATION
        CENTER: PASSWORD
        RIGHT: EMAIL
    ====================================== */}
    <div className="ad-admin-three-cards">


      {/* ======================================
          LEFT - INVITATION CODE
      ====================================== */}
      <section className="ad-admin-small-card ad-main-invite-card">

        <div className="ad-small-card-header">

          <div>
            <h3>Invitation Code</h3>

            <p className="ad-small-description">
              Customers using this code belong directly to Main Admin.
            </p>
          </div>

          <span className="ad-small-badge">
            MAIN ADMIN
          </span>

        </div>


        <div className="ad-small-card-form">

          <input
            type="text"
            value={mainInviteCode}
            maxLength={30}
            placeholder={
              inviteCodeLoading
                ? "Loading..."
                : "Enter invitation code"
            }
            disabled={
              inviteCodeLoading ||
              inviteCodeSaving
            }
            onChange={e =>
              setMainInviteCode(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9_-]/g, "")
              )
            }
          />


          {/* EDIT + CLEAR */}
          <div className="ad-invite-actions">

            <button
              type="button"
              className="ad-invite-edit-btn"
              disabled={
                inviteCodeLoading ||
                inviteCodeSaving
              }
              onClick={() => {
                document
                  .querySelector(".ad-main-invite-card input")
                  ?.focus();
              }}
            >
              Edit
            </button>


            <button
              type="button"
              className="ad-invite-delete-btn"
              disabled={
                inviteCodeLoading ||
                inviteCodeSaving ||
                !mainInviteCode.trim()
              }
              onClick={() => setMainInviteCode("")}
            >
              Clear
            </button>

          </div>


          <button
            type="button"
            className="ad-primary-btn ad-card-main-btn"
            disabled={
              inviteCodeLoading ||
              inviteCodeSaving ||
              !mainInviteCode.trim()
            }
            onClick={saveMainInviteCode}
          >
            {inviteCodeSaving
              ? "Saving..."
              : "Save Code"}
          </button>

        </div>


        {inviteCodeMessage && (
          <div className="ad-small-notice">
            {inviteCodeMessage}
          </div>
        )}

      </section>



      {/* ======================================
          CENTER - CHANGE PASSWORD
      ====================================== */}
      <section className="ad-admin-small-card">

        <div className="ad-small-card-header">

          <div>
            <h3>Change Password</h3>

            <p className="ad-small-description">
              Update your password securely using email verification.
            </p>
          </div>

          <span className="ad-small-badge">
            SECURITY
          </span>

        </div>


        {!adminPasswordOtpSent ? (

          <div className="ad-small-card-form">

            <input
              type="password"
              autoComplete="current-password"
              placeholder="Current Admin Password"
              value={adminCurrentPassword}
              onChange={e =>
                setAdminCurrentPassword(e.target.value)
              }
              disabled={adminSecurityLoading}
            />


            <input
              type="password"
              autoComplete="new-password"
              placeholder="New Password (minimum 8 characters)"
              value={adminNewPassword}
              onChange={e =>
                setAdminNewPassword(e.target.value)
              }
              disabled={adminSecurityLoading}
            />


            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm New Password"
              value={adminConfirmPassword}
              onChange={e =>
                setAdminConfirmPassword(e.target.value)
              }
              disabled={adminSecurityLoading}
            />


            <button
              type="button"
              className="ad-primary-btn ad-card-main-btn"
              disabled={
                adminSecurityLoading ||
                !adminCurrentPassword ||
                !adminNewPassword ||
                !adminConfirmPassword
              }
              onClick={requestAdminPasswordOtp}
            >
              {adminSecurityLoading
                ? "Sending..."
                : "Send OTP"}
            </button>

          </div>

        ) : (

          <div className="ad-small-card-form">

            <div className="ad-otp-info">

              <strong>Verification Required</strong>

              <span>
                Enter the 6-digit OTP sent to your admin email.
              </span>

            </div>


            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={adminPasswordOtp}
              onChange={e =>
                setAdminPasswordOtp(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
            />


            <button
              type="button"
              className="ad-primary-btn ad-card-main-btn"
              disabled={
                adminSecurityLoading ||
                adminPasswordOtp.length !== 6
              }
              onClick={verifyAdminPasswordOtp}
            >
              {adminSecurityLoading
                ? "Updating..."
                : "Update Password"}
            </button>


            <button
              type="button"
              className="ad-outline-btn ad-card-cancel-btn"
              disabled={adminSecurityLoading}
              onClick={() => {
                setAdminPasswordOtpSent(false);
                setAdminPasswordOtp("");
              }}
            >
              Cancel
            </button>

          </div>

        )}

      </section>



      {/* ======================================
          RIGHT - CHANGE EMAIL
      ====================================== */}
      <section className="ad-admin-small-card">

        <div className="ad-small-card-header">

          <div>
            <h3>Change Email</h3>

            <p className="ad-small-description">
              Update your admin email securely.
            </p>
          </div>

          <span className="ad-small-badge">
            EMAIL
          </span>

        </div>


        {!adminEmailOtpSent ? (

          <div className="ad-small-card-form">

            <input
              type="password"
              autoComplete="current-password"
              placeholder="Current Admin Password"
              value={adminCurrentPassword}
              onChange={e =>
                setAdminCurrentPassword(e.target.value)
              }
              disabled={adminSecurityLoading}
            />


            <input
              type="email"
              placeholder="New Admin Email Address"
              value={adminNewEmail}
              onChange={e =>
                setAdminNewEmail(e.target.value)
              }
              disabled={adminSecurityLoading}
            />


            <button
              type="button"
              className="ad-primary-btn ad-card-main-btn"
              disabled={
                adminSecurityLoading ||
                !adminCurrentPassword ||
                !adminNewEmail.trim()
              }
              onClick={requestAdminEmailOtp}
            >
              {adminSecurityLoading
                ? "Sending..."
                : "Send OTP"}
            </button>

          </div>

        ) : (

          <div className="ad-small-card-form">

            <div className="ad-otp-info">

              <strong>Verification Required</strong>

              <span>
                Enter both 6-digit OTP codes.
              </span>

            </div>


            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Old Email OTP"
              value={adminOldEmailOtp}
              onChange={e =>
                setAdminOldEmailOtp(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
            />


            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="New Email OTP"
              value={adminNewEmailOtp}
              onChange={e =>
                setAdminNewEmailOtp(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
            />


            <button
              type="button"
              className="ad-primary-btn ad-card-main-btn"
              disabled={
                adminSecurityLoading ||
                adminOldEmailOtp.length !== 6 ||
                adminNewEmailOtp.length !== 6
              }
              onClick={verifyAdminEmailOtp}
            >
              {adminSecurityLoading
                ? "Verifying..."
                : "Verify Email"}
            </button>


            <button
              type="button"
              className="ad-outline-btn ad-card-cancel-btn"
              disabled={adminSecurityLoading}
              onClick={() => {
                setAdminEmailOtpSent(false);
                setAdminOldEmailOtp("");
                setAdminNewEmailOtp("");
              }}
            >
              Cancel
            </button>

          </div>

        )}

      </section>

    </div>


    {/* SECURITY MESSAGE */}
    {adminSecurityMessage && (
      <div className="ad-notice">
        {adminSecurityMessage}
      </div>
    )}


    {/* LOGOUT */}
    <button
      type="button"
      className="ad-danger-btn"
      onClick={logout}
    >
      Logout Admin
    </button>

  </section>
)}
{/* ======================================
    WALLET & QR SETTINGS PAGE
====================================== */}

{settingsView === "wallet" && (
  <section className="ad-panel ad-settings">

    <button
      type="button"
      className="ad-back-btn"
      onClick={() => setSettingsView("home")}
    >
      ← Back to Settings
    </button>

    <div className="ad-settings-page-header">
      <div>
        <h2>Wallet & QR Settings</h2>

        <p className="ad-muted">
          Manage wallet addresses and QR images displayed to customers.
        </p>
      </div>
    </div>

    {/* WALLET CARDS */}
    <div className="ad-wallet-grid">

      {[
        {
          key: "trc20_address",
          qrKey: "trc20_qr_url",
          asset: "trc20",
          title: "TRC20",
          label: "TRC20 Address"
        },
        {
          key: "btc_address",
          qrKey: "btc_qr_url",
          asset: "btc",
          title: "Bitcoin",
          label: "BTC Bitcoin Address"
        },
        {
          key: "eth_address",
          qrKey: "eth_qr_url",
          asset: "eth",
          title: "Ethereum",
          label: "ETH Address"
        }
      ].map(item => (

        <div
          className="ad-wallet-card"
          key={item.key}
        >

          {/* CARD HEADER */}
          <div className="ad-wallet-card-header">
            <h3>{item.title}</h3>
            <p>{item.label}</p>
          </div>


          {/* WALLET ADDRESS */}
          <div className="ad-wallet-input-row">

            <input
              type="text"
              value={platformSettings[item.key] || ""}
              placeholder={`Enter ${item.label}`}
              onChange={e =>
                setPlatformSettings(current => ({
                  ...current,
                  [item.key]: e.target.value
                }))
              }
            />

            <button
              type="button"
              className="ad-primary-btn ad-wallet-update-btn"
              disabled={
                !!platformSaving ||
                platformLoading
              }
              onClick={() =>
                savePlatformSetting(item.key)
              }
            >
              {platformSaving === item.key
                ? "Updating..."
                : "Update"}
            </button>

          </div>


          {/* QR SECTION */}
          <div className="ad-wallet-qr-section">

            {platformSettings[item.qrKey] ? (

              <div className="ad-qr-preview-wrapper">

                <img
                  src={platformSettings[item.qrKey]}
                  alt={`${item.label} QR Code`}
                  className="ad-wallet-qr-image"
                />


                <div className="ad-qr-actions">

                  <span className="ad-qr-status">
                    ✓ QR Uploaded
                  </span>

                  <button
                    type="button"
                    className="ad-delete-qr-btn"
                    disabled={
                      qrUploading === item.asset
                    }
                    onClick={() =>
                      deleteWalletQr(item.asset)
                    }
                  >
                    {qrUploading === item.asset
                      ? "Deleting..."
                      : "Delete QR"}
                  </button>

                </div>

              </div>

            ) : (

              <div className="ad-no-qr">
                No QR image uploaded yet
              </div>

            )}


            {/* UPLOAD QR */}
            <label className="ad-upload-qr-btn">

              {qrUploading === item.asset
                ? "Uploading..."
                : "Upload QR Image"}

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={
                  qrUploading === item.asset
                }
                onClick={e => {
                  e.currentTarget.value = "";
                }}
                onChange={e =>
                  uploadWalletQr(
                    item.asset,
                    e.target.files?.[0]
                  )
                }
              />

            </label>


            {qrMessages[item.asset] && (
              <p className="ad-qr-message">
                {qrMessages[item.asset]}
              </p>
            )}

          </div>

        </div>

      ))}

    </div>

  </section>
)}

</>
)}
            {/* ======================================
                BALANCE MODAL
            ====================================== */}

            {modal === "balance" && selectedCustomer && (
              <div
                className="ad-modal-backdrop"
                onClick={() => setModal(null)}
              >
                <div
                  className="ad-modal"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className="ad-modal-close"
                    onClick={() => setModal(null)}
                  >
                    ×
                  </button>

                  <h2>
                    {balanceType === "add"
                      ? "Add Customer Balance"
                      : "Deduct Customer Balance"}
                  </h2>

                  <p>
                    {selectedCustomer.username || selectedCustomer.email}
                  </p>

                  <label>Amount (USD)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={balanceAmount}
                    onChange={e => setBalanceAmount(e.target.value)}
                    placeholder="Enter amount"
                  />

                  <div className="ad-modal-actions">
                    <button
                      className="ad-outline-btn"
                      onClick={() => setModal(null)}
                    >
                      Cancel
                    </button>

                    <button
                      className="ad-primary-btn"
                      onClick={submitBalance}
                    >
                      Confirm {balanceType === "add" ? "Add" : "Deduct"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================
                CUSTOMER SETTINGS MODAL
            ====================================== */}

            {modal === "customer" && selectedCustomer && (
              <CustomerSettingsModal
                customer={selectedCustomer}
                money={money}
                onClose={() => setModal(null)}
              />
            )}

            {/* ======================================
                CUSTOMER TRADING ACTIVITY MODAL
            ====================================== */}

            {modal === "customer-activity" && selectedCustomer && (
              <div
                className="ad-modal-backdrop"
                onClick={() => setModal(null)}
              >
                <div
                  className="ad-modal ad-customer-modal"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className="ad-modal-close"
                    onClick={() => setModal(null)}
                  >
                    ×
                  </button>

                  <div className="ad-customer-modal-heading">
                    <span>CUSTOMER MANAGEMENT</span>
                    <h2>Trading Activity</h2>
                    <p>
                      {selectedCustomer.username || selectedCustomer.email}
                    </p>
                  </div>

                  <div className="ad-setting-row">
                    <span>Customer ID</span>
                    <strong>
                      {selectedCustomer.custom_id || selectedCustomer.id}
                    </strong>
                  </div>

                  <div className="ad-activity-placeholder">
                    <span>⌁</span>
                    <h3>Customer Trading Records</h3>
                    <p>
                      Individual open positions, trade history and profit/loss
                      records will appear here after the trading activity API
                      is connected.
                    </p>
                  </div>

                  <button
                    className="ad-primary-btn full"
                    onClick={() => setModal(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ==========================================
// CUSTOMER TABLE
// ==========================================

function CustomerTable({ rows, money, openBalance, openCustomer }) {
  return (
    <div className="ad-table-wrap">
      <table className="ad-customer-table">
        <colgroup>
          <col style={{ width: "17%" }} />
          <col style={{ width: "21%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "19%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "17%" }} />
        </colgroup>

        <thead>
          <tr>
            <th>Customer</th>
            <th>Email</th>
            <th>Balance</th>
            <th>Trade Ctrl</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.map(customer => (
            <tr key={customer.id}>
              <td>
                <div className="ad-customer-name">
                  <div className="ad-avatar small">
                    {(customer.username || customer.email || "C")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>{customer.username || "Customer"}</strong>
                    <small>
                      {customer.custom_id ||
                        String(customer.id || "").slice(0, 8)}
                    </small>
                  </div>
                </div>
              </td>

              <td className="ad-customer-email">
                {customer.email || "—"}
              </td>

              <td>
                <strong>{money(customer.balance)}</strong>

                <div className="ad-balance-actions">
               <button
  className="ad-balance-add"
  onClick={() => openBalance(customer, "add")}
>
  + Add
</button>

                  <button
  className="ad-balance-deduct"
  onClick={() => openBalance(customer, "deduct")}
>
  − Deduct
</button>
                </div>
              </td>

              <td>
                <CustomerTradeControls customerId={customer.id} />
              </td>

              <td>
                <span
                  className={`ad-status ${
                    customer.status === "frozen" ||
                    customer.is_active === false
                      ? "frozen"
                      : "active"
                  }`}
                >
                  {customer.status ||
                    (customer.is_active === false
                      ? "disabled"
                      : "active")}
                </span>
              </td>

              <td>
                <div className="ad-customer-actions">
                  <button
                    className="ad-icon-btn ad-activity-btn"
                    title="Trading Activity"
                    onClick={() =>
                      openCustomer({
                        ...customer,
                        __view: "activity"
                      })
                    }
                  >
                    <span>⌁</span>
                    <small>Trading Activity</small>
                  </button>

                  <button
                    className="ad-icon-btn ad-settings-btn"
                    title="Customer Settings"
                    onClick={() => openCustomer(customer)}
                  >
                    <span>⚙</span>
                    <small>Settings</small>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div className="ad-empty">
          <span>♙</span>
          <p>No customer records found.</p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// CUSTOMER TRADING SWITCHES
// ==========================================

function CustomerTradeControls({ customerId }) {
  const [settings, setSettings] = useState({
    auto_trading_enabled: false,
    manual_trading_enabled: true,
    trading_enabled: true
  });

  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await adminFetch(
          `${API}/admin/customers/${customerId}/settings`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Settings load failed");
        }

        if (active) {
          setSettings({
            auto_trading_enabled:
              result.trading?.auto_trading_enabled ?? false,
            manual_trading_enabled:
              result.trading?.manual_trading_enabled ?? true,
            trading_enabled:
              result.trading?.trading_enabled ?? true
          });
        }
      } catch (err) {
        console.error("Trading settings load error:", err);
      } finally {
        if (active) setLoaded(true);
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [customerId]);

  async function updateSetting(key, value) {
    if (saving || !loaded) return;

    const previousSettings = { ...settings };

    setSettings(current => ({
      ...current,
      [key]: value
    }));

    setSaving(true);

    try {
      const response = await adminFetch(
        `${API}/admin/customers/${customerId}/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            [key]: value
          })
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Settings update failed");
      }
    } catch (err) {
      setSettings(previousSettings);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function TradeSwitch({ label, setting }) {
    return (
      <label className="ad-trade-switch">
        <span>{label}</span>

        <input
          type="checkbox"
          checked={settings[setting]}
          disabled={!loaded || saving}
          onChange={e => updateSetting(setting, e.target.checked)}
        />

        <span className="ad-trade-slider"></span>
      </label>
    );
  }

  return (
    <div className="ad-trade-controls">
      <div className="ad-trade-top">
        <TradeSwitch
          label="Auto"
          setting="auto_trading_enabled"
        />

        <TradeSwitch
          label="Manual"
          setting="manual_trading_enabled"
        />
      </div>

      <div className="ad-trade-bottom">
        <TradeSwitch
          label="Lock"
          setting="trading_enabled"
        />
      </div>
    </div>
  );
}

// ==========================================
// CUSTOMER SETTINGS MODAL
// ==========================================

function CustomerSettingsModal({ customer, money, onClose }) {
  const [form, setForm] = useState({
    status: customer.status || (
      customer.is_active === false ? "disabled" : "active"
    ),
    status_message: "",
    trc20_address: "",
    erc20_address: "",
    withdrawal_enabled: true,
    withdrawal_message: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [loginPassword, setLoginPassword] = useState("");
  const [confirmLoginPassword, setConfirmLoginPassword] = useState("");

  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [confirmWithdrawPassword, setConfirmWithdrawPassword] = useState("");

  const [passwordSaving, setPasswordSaving] = useState(false);

  // LOAD CUSTOMER SETTINGS
  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await adminFetch(
          `${API}/admin/customers/${customer.id}/settings`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Settings load failed");
        }

        if (active) {
          setForm({
            status: result.profile?.status || "active",
            status_message: result.profile?.status_message || "",
            trc20_address: result.wallet?.trc20_address || "",
            erc20_address: result.wallet?.erc20_address || "",
            withdrawal_enabled:
              result.wallet?.withdrawal_enabled ?? true,
            withdrawal_message:
              result.wallet?.withdrawal_message || ""
          });
        }
      } catch (err) {
        console.error("Customer settings load error:", err);
        alert(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [customer.id]);

  function updateField(key, value) {
    setForm(current => ({
      ...current,
      [key]: value
    }));
  }

  // SAVE ACCOUNT, WALLET AND WITHDRAWAL SETTINGS
  async function saveSettings() {
    if (saving || loading) return;

    setSaving(true);

    try {
      const response = await adminFetch(
        `${API}/admin/customers/${customer.id}/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(form)
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Settings save failed");
      }

      alert("Customer settings saved successfully.");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  // CHANGE LOGIN OR WITHDRAWAL PASSWORD
  async function changePassword(type) {
    const isLogin = type === "login";

    const password = isLogin
      ? loginPassword
      : withdrawPassword;

    const confirmPassword = isLogin
      ? confirmLoginPassword
      : confirmWithdrawPassword;

    if (!password) {
      alert("Please enter the new password.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (isLogin && password.length < 8) {
      alert("Login password must be at least 8 characters.");
      return;
    }

    if (
      !isLogin &&
      !/^[a-zA-Z0-9]{6,32}$/.test(password)
    ) {
      alert("Withdrawal password must be 6-32 letters or numbers.");
      return;
    }

    setPasswordSaving(true);

    try {
      const endpoint = isLogin
        ? "login-password"
        : "withdrawal-password";

      const response = await adminFetch(
        `${API}/admin/customers/${customer.id}/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            newPassword: password
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Password update failed");
      }

      if (isLogin) {
        setLoginPassword("");
        setConfirmLoginPassword("");
      } else {
        setWithdrawPassword("");
        setConfirmWithdrawPassword("");
      }

      alert(result.message || "Password updated successfully.");
    } catch (err) {
      alert(err.message);
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div
      className="ad-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="ad-modal ad-customer-modal ad-customer-settings-modal"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="ad-modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="ad-customer-modal-heading">
          <span>CUSTOMER MANAGEMENT</span>
          <h2>Customer Settings</h2>
          <p>{customer.username || customer.email}</p>
        </div>

        <div className="ad-setting-row">
          <span>Customer ID</span>
          <strong>{customer.custom_id || customer.id}</strong>
        </div>

        <div className="ad-setting-row">
          <span>Email</span>
          <strong>{customer.email || "—"}</strong>
        </div>

        <div className="ad-setting-row">
          <span>Balance</span>
          <strong>{money(customer.balance)}</strong>
        </div>

        {loading ? (
          <div className="ad-loading">
            Loading customer settings...
          </div>
        ) : (
          <>
            {/* ACCOUNT STATUS */}
            <section className="ad-customer-setting-section">
              <h3>Account Status</h3>

              <label className="ad-customer-field">
                <span>Customer Status</span>

                <select
                  value={form.status}
                  onChange={e =>
                    updateField("status", e.target.value)
                  }
                >
                  <option value="active">Active</option>
                  <option value="frozen">Frozen</option>
                  <option value="disabled">Disabled</option>
                </select>
              </label>

              <label className="ad-customer-field">
                <span>Account Notification</span>

                <textarea
                  rows="3"
                  value={form.status_message}
                  onChange={e =>
                    updateField("status_message", e.target.value)
                  }
                  placeholder="Enter account status notification..."
                />
              </label>
            </section>

            {/* WALLET ADDRESSES */}
            <section className="ad-customer-setting-section">
              <h3>Wallet Addresses</h3>

              <label className="ad-customer-field">
                <span>TRC20 Address</span>

                <input
                  type="text"
                  value={form.trc20_address}
                  onChange={e =>
                    updateField("trc20_address", e.target.value)
                  }
                  placeholder="Enter TRC20 address"
                />
              </label>

              <label className="ad-customer-field">
                <span>ERC20 Address</span>

                <input
                  type="text"
                  value={form.erc20_address}
                  onChange={e =>
                    updateField("erc20_address", e.target.value)
                  }
                  placeholder="Enter ERC20 address"
                />
              </label>
            </section>

            {/* WITHDRAWAL SETTINGS */}
            <section className="ad-customer-setting-section">
              <h3>Withdrawal Settings</h3>

              <label className="ad-customer-toggle">
                <span>Withdrawal Enabled</span>

                <input
                  type="checkbox"
                  checked={form.withdrawal_enabled}
                  onChange={e =>
                    updateField(
                      "withdrawal_enabled",
                      e.target.checked
                    )
                  }
                />

                <span className="ad-customer-toggle-slider"></span>
              </label>

              <label className="ad-customer-field">
                <span>Withdrawal Notification</span>

                <textarea
                  rows="3"
                  value={form.withdrawal_message}
                  onChange={e =>
                    updateField(
                      "withdrawal_message",
                      e.target.value
                    )
                  }
                  placeholder="Enter withdrawal notification..."
                />
              </label>
            </section>

            {/* LOGIN PASSWORD */}
            <section className="ad-customer-setting-section">
              <h3>Change Login Password</h3>

              <label className="ad-customer-field">
                <span>New Login Password</span>

                <input
                  type="password"
                  autoComplete="new-password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </label>

              <label className="ad-customer-field">
                <span>Confirm Login Password</span>

                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmLoginPassword}
                  onChange={e =>
                    setConfirmLoginPassword(e.target.value)
                  }
                  placeholder="Confirm new password"
                />
              </label>

              <button
                className="ad-primary-btn"
                disabled={passwordSaving}
                onClick={() => changePassword("login")}
              >
                {passwordSaving
                  ? "Updating..."
                  : "Update Login Password"}
              </button>
            </section>

            {/* WITHDRAWAL PASSWORD */}
            <section className="ad-customer-setting-section">
              <h3>Reset Withdrawal Password</h3>

              <label className="ad-customer-field">
                <span>New Withdrawal Password</span>

                <input
                  type="password"
                  autoComplete="new-password"
                  value={withdrawPassword}
                  onChange={e => setWithdrawPassword(e.target.value)}
                  placeholder="6-32 letters or numbers"
                />
              </label>

              <label className="ad-customer-field">
                <span>Confirm Withdrawal Password</span>

                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmWithdrawPassword}
                  onChange={e =>
                    setConfirmWithdrawPassword(e.target.value)
                  }
                  placeholder="Confirm withdrawal password"
                />
              </label>

              <button
                className="ad-primary-btn"
                disabled={passwordSaving}
                onClick={() => changePassword("withdrawal")}
              >
                {passwordSaving
                  ? "Updating..."
                  : "Reset Withdrawal Password"}
              </button>
            </section>

            {/* TWO FACTOR AUTHENTICATION */}
            <section className="ad-customer-setting-section">
              <h3>Two-Factor Authentication</h3>

              <p className="ad-muted">
                Customer authenticator reset requires a dedicated
                secure backend endpoint.
              </p>

              <button
                className="ad-outline-btn"
                disabled
                title="2FA backend endpoint is not connected"
              >
                2FA Reset — Backend Pending
              </button>
            </section>

            {/* SAVE SETTINGS */}
            <div className="ad-customer-save-actions">
              <button
                type="button"
                className="ad-outline-btn"
                onClick={onClose}
                disabled={saving || passwordSaving}
              >
                Close
              </button>

              <button
                type="button"
                className="ad-primary-btn"
                disabled={saving || loading}
                onClick={saveSettings}
              >
                {saving ? "Saving..." : "Save Customer Settings"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
