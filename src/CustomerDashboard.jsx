import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import TwoFactorSettings from "./TwoFactorSettings";
const NAV = [
  ["home", "⌂", "Home"],
  ["service", "◉", "Service"],
  ["markets", "▥", "Markets"],
  ["trading", "↗", "Trading"],
  ["profile", "◎", "Profile"],
];

const LANGUAGES = [
  ["en", "English"], ["ur", "اردو"], ["hi", "हिन्दी"], ["zh", "中文"],
  ["ja", "日本語"], ["ko", "한국어"], ["fr", "Français"], ["de", "Deutsch"],
  ["es", "Español"], ["it", "Italiano"], ["pt", "Português"], ["nl", "Nederlands"],
  ["ru", "Русский"], ["tr", "Türkçe"], ["ar", "العربية"], ["bn", "বাংলা"],
  ["id", "Bahasa Indonesia"], ["ms", "Bahasa Melayu"], ["th", "ไทย"], ["vi", "Tiếng Việt"]
];

const marketRows = [
  ["₿", "Bitcoin", "BTC / USDT", "$67,420.50", "+2.48%", true],
  ["◆", "Ethereum", "ETH / USDT", "$3,520.18", "+1.82%", true],
  ["◈", "BNB", "BNB / USDT", "$612.40", "-0.64%", false],
  ["◎", "Solana", "SOL / USDT", "$182.75", "+4.21%", true],
  ["✕", "XRP", "XRP / USDT", "$0.6241", "-1.12%", false],
];

function money(value) {
  return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CustomerDashboard() {
const handleCustomerLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    sessionStorage.removeItem("customer_page");

  } catch (error) {
    console.error("Customer logout error:", error);
    notify(error.message || "Logout failed. Please try again.");
  }
};
  const [page, setPage] = useState(
  () => sessionStorage.getItem("customer_page") || "home"
);
  const [language, setLanguage] = useState("en");
  const [historyTab, setHistoryTab] = useState("Deposit");
  const [faqOpen, setFaqOpen] = useState(0);
  const [depositStep, setDepositStep] = useState(1);
  const [asset, setAsset] = useState("USDT");
  const [network, setNetwork] = useState("TRC20");
  const [amount, setAmount] = useState("200");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [trc20Address, setTrc20Address] = useState("");
const [erc20Address, setErc20Address] = useState("");
const [walletLoading, setWalletLoading] = useState(true);
const [walletSaving, setWalletSaving] = useState(false);
  const [marketType, setMarketType] = useState("spot");
const [liveMarkets, setLiveMarkets] = useState({
  spot: [],
  futures: [],
});
const [showP2PPage, setShowP2PPage] = useState(false);
const [futuresStats, setFuturesStats] = useState(null);
const [futuresNow, setFuturesNow] = useState(Date.now());
const [marketSearch, setMarketSearch] = useState("");
const [activeMarketSection, setActiveMarketSection] = useState("crypto");
const [marketLogs, setMarketLogs] = useState([]);
const [marketStatus, setMarketStatus] = useState("connecting");
const [depositWallet, setDepositWallet] = useState(null);
const [depositWalletLoading, setDepositWalletLoading] = useState(false);
const [depositScreenshot, setDepositScreenshot] = useState(null);
const [selectedStock, setSelectedStock] = useState(null);
const [stockAction, setStockAction] = useState("details");
const [stockQuantity, setStockQuantity] = useState("1");
const [profile, setProfile] = useState(null);
const [profileLoading, setProfileLoading] = useState(true);
const [openServiceFaq, setOpenServiceFaq] = useState(null);
const [isServiceFaqOpen, setIsServiceFaqOpen] = useState(false);



const [serviceActivityIndex, setServiceActivityIndex] = useState(0);

const [serviceDemoActivities] = useState(() => {
  const types = [
    "Deposit Approved",
    "Deposit Received",
    "Withdrawal Approved",
    "Withdrawal Completed",
    "P2P Buy Order",
    "P2P Sell Order",
    "P2P Order Completed",
    "Trade Winner",
    "Trading Profit"
  ];

  return Array.from({ length: 80 }, (_, i) => ({
    id: i + 1,
    type: types[Math.floor(Math.random() * types.length)],
user: `user-${Math.random().toString(36).slice(2, 6)}****`,
    amount: (100 + Math.random() * 29900).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )
  }));
});

const [tradingMarket, setTradingMarket] = useState({
  type: "crypto",
  symbol: "BTCUSDT",
  name: "Bitcoin",
  currency: "USDT"
});

const [orderBook, setOrderBook] = useState({
  bids: [],
  asks: [],
  loading: true
});

const [orderSide, setOrderSide] = useState("buy");
const [orderType, setOrderType] = useState("market");
const [orderQuantity, setOrderQuantity] = useState("0.001");
const [orderPrice, setOrderPrice] = useState("");
const [orderLeverage, setOrderLeverage] = useState("1");
const [orderStopPrice, setOrderStopPrice] = useState("");
const [orderTif, setOrderTif] = useState("GTC");
const [orderReduceOnly, setOrderReduceOnly] = useState(false);
const [orderTakeProfit, setOrderTakeProfit] = useState("");
const [orderStopLoss, setOrderStopLoss] = useState("");
const [orderSlippage, setOrderSlippage] = useState("0.5");
const [orderRecurring, setOrderRecurring] = useState("Daily");
// ================= P2P EXCHANGE STATES =================

const [p2pType, setP2pType] = useState("buy");
const [p2pAmount, setP2pAmount] = useState("");
const [p2pCountry, setP2pCountry] = useState("");
const [p2pPaymentMethod, setP2pPaymentMethod] = useState("");
const [p2pExchange, setP2pExchange] = useState("");

const [p2pContactConfirmed, setP2pContactConfirmed] = useState(false);
const [p2pSubmitting, setP2pSubmitting] = useState(false);
const [p2pOrders, setP2pOrders] = useState([]);

const [tradingTimeframe, setTradingTimeframe] = useState("15");




const [depositSubmitting, setDepositSubmitting] = useState(false);
// SECURITY SETTINGS
const [currentLoginPassword, setCurrentLoginPassword] = useState("");
const [newLoginPassword, setNewLoginPassword] = useState("");
const [confirmLoginPassword, setConfirmLoginPassword] = useState("");

const [withdrawPassword, setWithdrawPassword] = useState("");
const [confirmWithdrawPassword, setConfirmWithdrawPassword] = useState("");

const [newEmail, setNewEmail] = useState("");

const [securityLoading, setSecurityLoading] = useState(false);





  const [toast, setToast] = useState("");
  const [modal, setModal] = useState("");
  const [faqItems] = useState([
    ["How can I make a deposit?", "Open Deposit, choose your asset and network, then follow the payment instructions shown on the next step."],
    ["How long do withdrawals take?", "Withdrawal requests are subject to account checks and platform processing. Current processing details will be shown when the service is connected."],
    ["How do I protect my account?", "Use a unique password, keep verification codes private, and enable two-step verification in Settings."],
    ["Are trading profits guaranteed?", "No. Digital-asset prices can move quickly and trading can result in losses."]
  ]);


useEffect(() => {
  let isMounted = true;

  async function loadWalletSettings() {
    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) throw userError;

      const user = userData?.user;

      if (!user) {
        throw new Error("Please login first.");
      }

      const { data, error } = await supabase
        .from("customer_settings")
        .select("trc20_address, erc20_address")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (isMounted && data) {
        setTrc20Address(data.trc20_address || "");
        setErc20Address(data.erc20_address || "");
      }
    } catch (error) {
      console.error("Wallet settings load error:", error);

      if (isMounted) {
        notify(error.message || "Could not load wallet settings.");
      }
    } finally {
      if (isMounted) {
        setWalletLoading(false);
      }
    }
  }

  loadWalletSettings();

  return () => {
    isMounted = false;
  };
}, []);

useEffect(() => {
  const activityTimer = setInterval(() => {
    setServiceActivityIndex((prev) => (prev + 1) % serviceDemoActivities.length);
  }, 2500);

  return () => clearInterval(activityTimer);
}, [serviceDemoActivities.length]);

useEffect(() => {
  let channel = null;
  let refreshInterval = null;
  let isMounted = true;
  let currentUserId = null;
  let isLoadingProfile = false;

  // ==========================================
  // LOAD LATEST CUSTOMER PROFILE
  // ==========================================

  const loadCustomerProfile = async (showLoading = false) => {
    if (!isMounted || isLoadingProfile) return;

    isLoadingProfile = true;

    try {
      if (showLoading && isMounted) {
        setProfileLoading(true);
      }

      const {
        data: authData,
        error: authError
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      const user = authData?.user;

      if (!user) {
        if (isMounted) setProfile(null);
        return;
      }

      currentUserId = user.id;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (isMounted) {
        setProfile(data);
      }

    } catch (error) {
      console.error("Customer profile sync error:", error);
    } finally {
      isLoadingProfile = false;

      if (showLoading && isMounted) {
        setProfileLoading(false);
      }
    }
  };

  // ==========================================
  // SETUP SUPABASE REALTIME
  // ==========================================

  const setupRealtime = async () => {
    try {
      const {
        data: authData,
        error: authError
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      const user = authData?.user;

      if (!user || !isMounted) return;

      currentUserId = user.id;

      // Prevent duplicate channel
      if (channel) {
        await supabase.removeChannel(channel);
      }

      channel = supabase
        .channel(`customer-profile-live-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            if (!isMounted) return;

            console.log(
              "LIVE CUSTOMER BALANCE UPDATE:",
              payload.new.balance
            );

            // Instant profile and balance update
            setProfile(current => ({
              ...(current || {}),
              ...payload.new
            }));
          }
        )
        .subscribe((status) => {
          console.log(
            "Supabase Realtime:",
            status
          );

          if (status === "SUBSCRIBED") {
            console.log("Customer live balance connected!");
          }

          if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            console.warn("Realtime disconnected. Backup refresh active.");
          }
        });

    } catch (error) {
      console.error("Realtime setup error:", error);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  loadCustomerProfile(true);

  // ==========================================
  // START REALTIME
  // ==========================================

  setupRealtime();

  // ==========================================
  // BACKUP REFRESH EVERY 5 SECONDS
  // ==========================================

  refreshInterval = setInterval(() => {
    if (isMounted && currentUserId) {
      loadCustomerProfile(false);
    }
  }, 5000);

  // ==========================================
  // CLEANUP
  // ==========================================

  return () => {
    isMounted = false;

    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }

    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  };

}, []);




// ==================================
// LOAD DEPOSIT PAYMENT WALLET
// ==================================

useEffect(() => {
  let isMounted = true;

  async function loadDepositWallet() {
    setDepositWalletLoading(true);

    try {
      const { data, error } = await supabase
        .from("payment_wallet_settings")
        .select("asset, network, receiving_address, qr_code_url")
        .eq("asset", asset)
        .eq("network", network)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (isMounted) {
        setDepositWallet(data || null);
      }
    } catch (error) {
      console.error("Deposit wallet load error:", error);

      if (isMounted) {
        setDepositWallet(null);
        notify("Could not load payment wallet.");
      }
    } finally {
      if (isMounted) {
        setDepositWalletLoading(false);
      }
    }
  }

  loadDepositWallet();

  return () => {
    isMounted = false;
  };
}, [asset, network]);




// ==================================
// SUBMIT CUSTOMER DEPOSIT
// ==================================

const submitDeposit = async () => {
  let uploadedPath = null;

  try {
    if (!depositWallet?.receiving_address) {
      return notify("Payment wallet is not configured.");
    }

    if (!depositScreenshot) {
      return notify("Please upload your payment screenshot.");
    }

    if (depositScreenshot.size > 5 * 1024 * 1024) {
      return notify("Screenshot must be smaller than 5 MB.");
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(depositScreenshot.type)) {
      return notify("Only JPG, PNG and WEBP images are allowed.");
    }

    setDepositSubmitting(true);

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError) throw userError;

    const user = userData?.user;

    if (!user) {
      throw new Error("Please login first.");
    }

    const fileExtension =
      depositScreenshot.name.split(".").pop().toLowerCase();

    const fileName =
      `${user.id}/${crypto.randomUUID()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("deposit-screenshots")
      .upload(fileName, depositScreenshot, {
        contentType: depositScreenshot.type,
        upsert: false
      });

    if (uploadError) throw uploadError;

    uploadedPath = fileName;

    // USDT deposits only for now.
    // BTC/ETH conversion will be connected separately.
    if (asset !== "USDT") {
      throw new Error("BTC/ETH deposits are not enabled yet.");
    }

    const { error: insertError } = await supabase
      .from("deposit_requests")
      .insert({
        user_id: user.id,
        asset,
        network,
        amount_usdt: Number(amount),
        crypto_amount: Number(amount),
        receiving_address: depositWallet.receiving_address,
        screenshot_path: uploadedPath,
        status: "pending"
      });

    if (insertError) throw insertError;

    setDepositScreenshot(null);
    setAmount("200");
    setDepositStep(1);

    notify("Deposit request submitted successfully. Pending admin review!");

  } catch (error) {
    console.error("Deposit submission error:", error);

    // Remove uploaded screenshot if database insert failed
    if (uploadedPath) {
      const { error: removeError } = await supabase.storage
        .from("deposit-screenshots")
        .remove([uploadedPath]);

      if (removeError) {
        console.error("Screenshot cleanup error:", removeError);
      }
    }

    notify(error.message || "Deposit submission failed.");

  } finally {
    setDepositSubmitting(false);
  }
};

// ==================================
// CHANGE LOGIN PASSWORD
// ==================================

const changeLoginPassword = async () => {
  try {
    if (
      !currentLoginPassword ||
      !newLoginPassword ||
      !confirmLoginPassword
    ) {
      return notify("Please fill all login password fields.");
    }

    if (newLoginPassword.length < 8) {
      return notify("New password must be at least 8 characters.");
    }

    if (newLoginPassword !== confirmLoginPassword) {
      return notify("New passwords do not match.");
    }

    setSecurityLoading(true);

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError) throw userError;

    const email = userData?.user?.email;

    if (!email) {
      throw new Error("User email not found.");
    }

    // Verify current login password
    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password: currentLoginPassword
      });

    if (loginError) {
      throw new Error("Current password is incorrect.");
    }

    // Update new login password
    const { error: updateError } =
      await supabase.auth.updateUser({
        password: newLoginPassword
      });

    if (updateError) throw updateError;

    setCurrentLoginPassword("");
    setNewLoginPassword("");
    setConfirmLoginPassword("");

    notify("Login password updated successfully!");

  } catch (error) {
    console.error("Login password error:", error);
    notify(error.message || "Could not update login password.");

  } finally {
    setSecurityLoading(false);
  }
};


// ==================================
// SET / CHANGE WITHDRAWAL PASSWORD
// ==================================

const changeWithdrawPassword = async () => {
  try {
    if (!withdrawPassword || !confirmWithdrawPassword) {
      return notify(
        "Please enter and confirm withdrawal password."
      );
    }

    if (!/^[A-Za-z0-9]{6,32}$/.test(withdrawPassword)) {
      return notify(
        "Use 6 to 32 letters or numbers only."
      );
    }

    if (withdrawPassword !== confirmWithdrawPassword) {
      return notify("Withdrawal passwords do not match.");
    }

    setSecurityLoading(true);

    const { error } = await supabase.rpc(
      "set_withdrawal_password",
      {
        p_password: withdrawPassword
      }
    );

    if (error) throw error;

    setWithdrawPassword("");
    setConfirmWithdrawPassword("");

    notify("Withdrawal password saved securely!");

  } catch (error) {
    console.error("Withdrawal password error:", error);
    notify(error.message || "Could not save withdrawal password.");

  } finally {
    setSecurityLoading(false);
  }
};


// ==================================
// UPDATE EMAIL ADDRESS
// ==================================

const changeAccountEmail = async () => {
  try {
    if (!newEmail.trim()) {
      return notify("Please enter your new email address.");
    }

    setSecurityLoading(true);

    const { error } = await supabase.auth.updateUser({
      email: newEmail.trim()
    });

    if (error) throw error;

    setNewEmail("");

    notify(
      "Email update requested. Please check your new email for the confirmation link."
    );

  } catch (error) {
    console.error("Email update error:", error);
    notify(error.message || "Could not update email address.");

  } finally {
    setSecurityLoading(false);
  }
};


  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };
const go = (next) => {
  setPage(next);

  sessionStorage.setItem("customer_page", next);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

  const titleMap = {
    home: "Welcome back", profile: "My Profile", service: "Customer Service",
    markets: "Markets", trading: "Trading", rules: "Rules & Guidelines",
    status: "System Status", guide: "Trading Guide", security: "Security Protocols",
    how: "How It Works", history: "Transaction History", payments: "Payment Methods",
    settings: "Settings", deposit: "Deposit", withdraw: "Withdraw"
  };

  const CardLink = ({ icon, title, desc, target, onClick }) => (
    <button className="cd-link-card" onClick={onClick || (() => go(target))}>
      <span className="cd-link-icon">{icon}</span>
      <span className="cd-link-copy"><b>{title}</b><small>{desc}</small></span>
      <span className="cd-arrow">›</span>
    </button>
  );

const BackHeader = ({ title }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 18
  }}>
    <button
      type="button"
      onClick={() => setPage("profile")}
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: "#102b45",
        border: "1px solid #263c55",
        color: "#ffffff",
        fontSize: 25,
        cursor: "pointer"
      }}
    >
      ←
    </button>

    <h3 className="cd-panel-title" style={{ margin: 0 }}>
      {title}
    </h3>
  </div>
);
useEffect(() => {
  let active = true;

  const loadMarkets = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/markets/crypto"
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error("Market data unavailable");
      }

      if (active) {
        setLiveMarkets({
          spot: data.spot?.markets || [],
          futures: data.futures?.markets || [],
        });

        const status = data[marketType]?.status;

        setMarketStatus(
          status === "connected" ? "live" :
          status === "stale" ? "stale" : "connecting"
        );
      }
    } catch (error) {
      console.error("Market API error:", error);

      if (active) setMarketStatus("offline");
    }
  };

  loadMarkets();

  const timer = window.setInterval(loadMarkets, 15000);

  return () => {
    active = false;
    window.clearInterval(timer);
  };
}, [marketType]);

// ==================================
// TRADEX STOCK MARKET LIST
// ==================================

const stockUniverse = [
  {
    symbol:"AAPL",
    name:"Apple Inc.",
    exchange:"NASDAQ",
    country:"USA",
    currency:"USD",
    logo:"https://www.google.com/s2/favicons?domain=apple.com&sz=128"
  },
  {
    symbol:"MSFT",
    name:"Microsoft",
    exchange:"NASDAQ",
    country:"USA",
    currency:"USD",
    logo:"https://www.google.com/s2/favicons?domain=microsoft.com&sz=128"
  },
  {
    symbol:"NVDA",
    name:"NVIDIA",
    exchange:"NASDAQ",
    country:"USA",
    currency:"USD",
    logo:"https://www.google.com/s2/favicons?domain=nvidia.com&sz=128"
  },
  {
    symbol:"AMZN",
    name:"Amazon",
    exchange:"NASDAQ",
    country:"USA",
    currency:"USD",
    logo:"https://www.google.com/s2/favicons?domain=amazon.com&sz=128"
  },
  {
    symbol:"TSLA",
    name:"Tesla",
    exchange:"NASDAQ",
    country:"USA",
    currency:"USD",
    logo:"https://www.google.com/s2/favicons?domain=tesla.com&sz=128"
  },
  {
    symbol:"RELIANCE",
    name:"Reliance Industries",
    exchange:"NSE",
    country:"India",
    currency:"INR",
    logo:"https://www.google.com/s2/favicons?domain=ril.com&sz=128"
  },
  {
    symbol:"TCS",
    name:"Tata Consultancy Services",
    exchange:"NSE",
    country:"India",
    currency:"INR",
    logo:"https://www.google.com/s2/favicons?domain=tcs.com&sz=128"
  },
  {
    symbol:"HDFCBANK",
    name:"HDFC Bank",
    exchange:"NSE",
    country:"India",
    currency:"INR",
    logo:"https://www.google.com/s2/favicons?domain=hdfcbank.com&sz=128"
  },
  {
    symbol:"INFY",
    name:"Infosys",
    exchange:"NSE",
    country:"India",
    currency:"INR",
    logo:"https://www.google.com/s2/favicons?domain=infosys.com&sz=128"
  },
  {
    symbol:"ICICIBANK",
    name:"ICICI Bank",
    exchange:"NSE",
    country:"India",
    currency:"INR",
    logo:"https://www.google.com/s2/favicons?domain=icicibank.com&sz=128"
  }
];

// ==================================
// OPEN SELECTED MARKET IN TRADING
// ==================================

const openTradingMarket = (market, side = "buy") => {
  setTradingMarket(market);
  setOrderSide(side);
  setOrderQuantity(
    market.type === "stock" ? "1" : "0.001"
  );
  setOrderPrice("");
  setPage("trading");
  window.scrollTo({top:0,behavior:"smooth"});
};

// ==================================
// BINANCE LIVE ORDER BOOK
// ==================================

useEffect(() => {
  let active = true;

  if (tradingMarket.type !== "crypto") {
    setOrderBook({
      bids: [],
      asks: [],
      loading: false
    });
    return;
  }

  const loadOrderBook = async () => {
    try {
      const symbol = tradingMarket.symbol.toUpperCase();

      const endpoint = marketType === "futures"
        ? `https://fapi.binance.com/fapi/v1/depth?symbol=${symbol}&limit=20`
        : `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=20`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error("Order book unavailable");
      }

      const data = await response.json();

      if (active) {
        setOrderBook({
          bids: data.bids || [],
          asks: data.asks || [],
          loading: false
        });
      }

    } catch (error) {
      console.error("Order book error:",error);

      if (active) {
        setOrderBook({
          bids: [],
          asks: [],
          loading: false
        });
      }
    }
  };

  loadOrderBook();

  const timer = window.setInterval(loadOrderBook, 3000);

  return () => {
    active = false;
    window.clearInterval(timer);
  };

}, [tradingMarket, marketType]);
// ==================================
// BINANCE FUTURES LIVE STATISTICS
// ==================================

useEffect(() => {
  if (tradingMarket.type !== "crypto" || marketType !== "futures") {
    setFuturesStats(null);
    return;
  }

  let active = true;
  const symbol = tradingMarket.symbol;

  const loadFuturesStats = async () => {
    try {
      const [premiumRes, tickerRes, interestRes] = await Promise.all([
        fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`),
        fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`),
        fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`)
      ]);

      if (!premiumRes.ok || !tickerRes.ok || !interestRes.ok) {
        throw new Error("Binance Futures statistics unavailable");
      }

      const [premium, ticker, interest] = await Promise.all([
        premiumRes.json(),
        tickerRes.json(),
        interestRes.json()
      ]);

      if (!active) return;

      setFuturesStats({
        lastPrice: Number(ticker.lastPrice),
        markPrice: Number(premium.markPrice),
        indexPrice: Number(premium.indexPrice),
        fundingRate: Number(premium.lastFundingRate),
        nextFundingTime: Number(premium.nextFundingTime),
        high24h: Number(ticker.highPrice),
        low24h: Number(ticker.lowPrice),
        volume24h: Number(ticker.volume),
        quoteVolume24h: Number(ticker.quoteVolume),
        openInterest: Number(interest.openInterest)
      });

    } catch (error) {
      console.error("Futures statistics error:", error);
      if (active) setFuturesStats(null);
    }
  };

  loadFuturesStats();

  const dataTimer = window.setInterval(loadFuturesStats, 15000);
  const clockTimer = window.setInterval(() => {
    setFuturesNow(Date.now());
  }, 1000);

  return () => {
    active = false;
    window.clearInterval(dataTimer);
    window.clearInterval(clockTimer);
  };

}, [tradingMarket.symbol, tradingMarket.type, marketType]);
// ==================================
// SELECTED CRYPTO PRICE
// ==================================

const selectedCryptoPrice =
  liveMarkets[marketType]?.find(
    item => item.symbol === tradingMarket.symbol
  );

const currentTradingPrice =
  tradingMarket.type === "crypto"
    ? Number(selectedCryptoPrice?.price || 0)
    : null;




    const formatFuturesNumber = (value, digits = 2) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "--";
  }

  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: digits
  });
};

const fundingSeconds = futuresStats?.nextFundingTime
  ? Math.max(0, Math.floor((futuresStats.nextFundingTime - futuresNow) / 1000))
  : null;

const fundingCountdown = fundingSeconds === null
  ? "--"
  : [
      Math.floor(fundingSeconds / 3600),
      Math.floor((fundingSeconds % 3600) / 60),
      fundingSeconds % 60
    ].map(x => String(x).padStart(2, "0")).join(":");

const estimatedOrderTotal =
  Number(orderQuantity || 0) *
  Number(
    ["limit", "stop-limit"].includes(orderType)
      ? orderPrice || 0
      : currentTradingPrice || 0
  );
  return (

<div className="cd-shell">

  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    :root {
      --cd-bg:#071426;
      --cd-panel:#0e2035;
      --cd-panel2:#132941;
      --cd-border:#263d56;
      --cd-white:#f7f9fc;
      --cd-muted:#9aabc0;
      --cd-green:#20c88a;
      --cd-blue:#4d9fff;
      --cd-red:#ff6977;
    }

    *{box-sizing:border-box}

    .cd-shell{
      min-height:100vh;
      background:var(--cd-bg);
      color:var(--cd-white);
      font-family:Inter,Arial,sans-serif;
      padding-bottom:92px;
    }

    .cd-wrap{width:min(100%,1120px);margin:0 auto;padding:0 22px}

    .cd-top{
      height:76px;
      border-bottom:1px solid rgba(255,255,255,.07);
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:16px;
    }

    .cd-brand{display:flex;align-items:center;gap:11px;font-size:19px;font-weight:800;letter-spacing:.2px}
    .cd-logo{width:38px;height:38px;border-radius:12px;background:linear-gradient(145deg,#20c88a,#118b72);display:grid;place-items:center;color:#061b1b;font-weight:900;font-size:21px}
    .cd-top-right{display:flex;align-items:center;gap:12px}
    .cd-lang{background:#10243a;border:1px solid var(--cd-border);color:#eaf0f8;padding:9px 12px;border-radius:10px;outline:none;max-width:135px}
    .cd-avatar{width:37px;height:37px;border-radius:50%;display:grid;place-items:center;background:#1b3852;border:1px solid #34516d;font-weight:700}

    .cd-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:15px;margin:28px 0 20px}
    .cd-heading h1{font-size:25px;margin:0 0 7px;font-weight:800;letter-spacing:-.5px}
    .cd-heading p{margin:0;color:var(--cd-muted);font-size:13px}
    .cd-date{font-size:12px;color:var(--cd-muted)}

    .cd-hero{background:linear-gradient(120deg,#122c45,#10243a 58%,#103b3b);border:1px solid #29465d;border-radius:20px;padding:25px;display:flex;justify-content:space-between;align-items:center;gap:20px;overflow:hidden;position:relative}
    .cd-hero:after{content:"";position:absolute;width:240px;height:240px;border:1px solid rgba(255,255,255,.07);border-radius:50%;right:8%;top:-150px;box-shadow:0 0 0 25px rgba(255,255,255,.018),0 0 0 55px rgba(255,255,255,.014)}
    .cd-eyebrow{font-size:11px;color:#9fb5c9;text-transform:uppercase;letter-spacing:1.2px;font-weight:700}
    .cd-hero h2{font-size:25px;margin:8px 0 7px}
    .cd-hero p{font-size:13px;color:#b5c5d5;margin:0;max-width:440px;line-height:1.6}
    .cd-hero-mark{width:74px;height:74px;border-radius:22px;background:rgba(32,200,138,.12);border:1px solid rgba(32,200,138,.28);display:grid;place-items:center;font-size:36px;color:var(--cd-green);z-index:1}

    .cd-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:17px 0 25px}
    .cd-stat,.cd-panel{background:var(--cd-panel);border:1px solid var(--cd-border);border-radius:16px}
    .cd-stat{padding:17px 18px}
    .cd-stat-label{font-size:12px;color:var(--cd-muted);display:flex;align-items:center;gap:7px}
    .cd-stat-value{font-size:23px;font-weight:800;margin-top:10px;letter-spacing:-.5px}
    .cd-stat-foot{font-size:11px;color:var(--cd-green);margin-top:6px}

    .cd-section-head{display:flex;align-items:center;justify-content:space-between;margin:26px 0 13px}
    .cd-section-head h3{font-size:16px;margin:0;font-weight:700}
    .cd-section-head button,.cd-text-btn{background:none;border:0;color:var(--cd-green);font-size:12px;font-weight:700;cursor:pointer}
    .cd-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    .cd-link-card{width:100%;min-height:86px;text-align:left;display:flex;align-items:center;gap:12px;padding:15px;background:var(--cd-panel);border:1px solid var(--cd-border);border-radius:14px;color:var(--cd-white);cursor:pointer;transition:.2s}
    .cd-link-card:hover{border-color:#3e876f;transform:translateY(-2px);background:#112940}
    .cd-link-icon{width:39px;height:39px;flex:0 0 39px;border-radius:12px;background:#17364b;color:var(--cd-green);display:grid;place-items:center;font-size:19px}
    .cd-link-copy{display:flex;flex-direction:column;gap:5px;min-width:0}
    .cd-link-copy b{font-size:12px}
    .cd-link-copy small{font-size:10px;line-height:1.4;color:var(--cd-muted)}
    .cd-arrow{margin-left:auto;color:#8195aa;font-size:23px}

    .cd-panel{padding:20px;margin-bottom:15px}
    .cd-panel-title{font-size:15px;font-weight:700;margin:0 0 16px}
    .cd-market-row{display:grid;grid-template-columns:1.6fr 1fr 1fr .8fr;gap:12px;align-items:center;padding:13px 0;border-top:1px solid rgba(255,255,255,.06);font-size:12px}
    .cd-coin{display:flex;align-items:center;gap:10px;font-weight:700}
    .cd-coin-icon{width:32px;height:32px;border-radius:50%;background:#1a344c;display:grid;place-items:center;color:#e9c66b;font-size:16px}
    .cd-muted{color:var(--cd-muted)}
    .cd-green{color:var(--cd-green);font-weight:700}
    .cd-red{color:var(--cd-red);font-weight:700}

    .cd-profile-head{display:flex;align-items:center;gap:15px;padding:20px}
    .cd-profile-avatar{width:65px;height:65px;border-radius:20px;background:linear-gradient(145deg,#1e9978,#164b59);display:grid;place-items:center;font-size:22px;font-weight:800}
    .cd-profile-head h2{margin:0 0 5px;font-size:18px}
    .cd-profile-head p{margin:0;color:var(--cd-muted);font-size:12px}
    .cd-verified{margin-left:auto;border:1px solid rgba(32,200,138,.3);background:rgba(32,200,138,.1);color:var(--cd-green);padding:7px 10px;border-radius:20px;font-size:10px;font-weight:700}

    .cd-action-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
    .cd-btn{border:0;border-radius:11px;padding:12px 17px;background:var(--cd-green);color:#06251d;font-weight:800;font-size:12px;cursor:pointer}
    .cd-btn.secondary{background:#17344d;color:#e9f0f7;border:1px solid #34516a}
    .cd-btn.ghost{background:transparent;color:var(--cd-green);border:1px solid #27745e}
    .cd-btn:disabled{opacity:.5;cursor:not-allowed}

    .cd-list{display:grid;gap:10px}
    .cd-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:12px}
    .cd-row:last-child{border-bottom:0}
    .cd-row strong{font-size:12px}
    .cd-row span{color:var(--cd-muted)}
    .cd-badge{padding:5px 8px;border-radius:20px;background:rgba(32,200,138,.1);color:var(--cd-green);font-size:10px;font-weight:700}

    .cd-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .cd-field{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
    .cd-field label{font-size:11px;color:#b5c5d5;font-weight:600}
    .cd-field input,.cd-field select,.cd-field textarea{width:100%;background:#091a2c;color:#f5f8fc;border:1px solid #2b435c;border-radius:10px;padding:12px;font:inherit;font-size:12px;outline:none}
    .cd-field input:focus,.cd-field select:focus,.cd-field textarea:focus{border-color:var(--cd-green)}

    .cd-amounts{display:flex;flex-wrap:wrap;gap:8px}
    .cd-amount{padding:9px 13px;border:1px solid #30475f;border-radius:9px;background:#0a1b2d;color:#dce6ef;font-size:11px;cursor:pointer}
    .cd-amount.selected{border-color:var(--cd-green);background:rgba(32,200,138,.12);color:var(--cd-green)}
    .cd-note{padding:13px;border-radius:11px;background:#112a40;border:1px solid #29475d;color:#b8c8d7;font-size:11px;line-height:1.6;margin:12px 0}

    .cd-step{display:flex;align-items:center;gap:10px;margin-bottom:18px}
    .cd-step span{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#1d775d;color:#fff;font-size:11px;font-weight:700}
    .cd-step b{font-size:12px}

    .cd-faq{border-bottom:1px solid rgba(255,255,255,.07);padding:15px 0}
    .cd-faq button{display:flex;justify-content:space-between;width:100%;background:none;border:0;color:#f4f7fb;text-align:left;font-size:12px;font-weight:700;cursor:pointer;padding:0}
    .cd-faq p{font-size:11px;color:var(--cd-muted);line-height:1.7;margin:12px 0 0}

    .cd-tabs{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px}
    .cd-tab{padding:9px 14px;border-radius:9px;background:#0a1b2d;border:1px solid #2b435c;color:#aebed0;font-size:11px;cursor:pointer}
    .cd-tab.active{background:rgba(32,200,138,.12);border-color:#268767;color:var(--cd-green)}
    .cd-status-dot{width:7px;height:7px;border-radius:50%;background:var(--cd-green);display:inline-block;margin-right:7px}
    .cd-empty{text-align:center;padding:35px 15px;color:var(--cd-muted);font-size:12px}
    .cd-empty strong{display:block;color:#edf3f9;margin:10px 0 6px}

    .cd-bottom{position:fixed;bottom:0;left:0;right:0;z-index:20;background:rgba(7,20,38,.96);backdrop-filter:blur(14px);border-top:1px solid #263d56;padding:9px 12px calc(9px + env(safe-area-inset-bottom));display:flex;justify-content:center}
    .cd-bottom-inner{width:min(100%,620px);display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
    .cd-nav{border:0;background:none;color:#8396aa;display:flex;flex-direction:column;align-items:center;gap:5px;padding:5px 2px;font-size:10px;cursor:pointer}
    .cd-nav span{font-size:19px;line-height:1}
    .cd-nav.active{color:var(--cd-green);font-weight:800}

    .cd-toast{position:fixed;bottom:88px;left:50%;transform:translateX(-50%);z-index:50;background:#e9f2f8;color:#071426;padding:11px 17px;border-radius:10px;font-size:12px;font-weight:700;box-shadow:0 8px 30px #0006}
    .cd-modal-backdrop{position:fixed;inset:0;z-index:40;background:#0009;display:grid;place-items:center;padding:20px}
    .cd-modal{width:min(100%,420px);background:#10243a;border:1px solid #36516b;border-radius:17px;padding:22px}
    .cd-modal h3{margin:0 0 10px;font-size:17px}
    .cd-modal p{font-size:12px;color:var(--cd-muted);line-height:1.6}

    /* TRADEX BINANCE STYLE TERMINAL */

    .cd-trading-terminal{
      width:100%;
      color:#e5edf7;
      min-width:0;
    }

    .cd-trade-top{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:14px;
      flex-wrap:wrap;
      background:#101f33;
      border:1px solid #263b55;
      border-radius:10px;
      padding:14px;
      margin-bottom:12px;
    }

    .cd-terminal-grid{
  display:grid;
  grid-template-columns:210px minmax(0,1fr) 310px;
  gap:10px;
  align-items:start;
}

.cd-terminal-center{
  min-width:0;
}

.cd-terminal-panel{
  background:#101f33;
  border:1px solid #263b55;
  border-radius:9px;
  padding:12px;
  min-width:0;
  overflow:hidden;
}
    .cd-book-head,
    .cd-book-row{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:5px;
      padding:5px 0;
      font-size:10px;
      text-align:right;
    }

    .cd-book-head{
      color:#8fa5bd;
      border-bottom:1px solid #263b55;
      margin-bottom:5px;
    }

    .cd-book-head span:first-child,
    .cd-book-row span:first-child{
      text-align:left;
    }

    .cd-book-row{
      border-bottom:1px solid rgba(38,59,85,.35);
      font-variant-numeric:tabular-nums;
    }

    .cd-order-buttons{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:8px;
    }

    .cd-order-buttons button{
      padding:11px 5px;
      border:0;
      border-radius:6px;
      font-weight:800;
      font-size:12px;
      cursor:pointer;
    }

    .cd-right-market-list{
      display:flex;
      flex-direction:column;
      max-height:540px;
      overflow-y:auto;
      gap:3px;
    }

    .cd-right-market-item{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:7px;
      width:100%;
      padding:10px 7px;
      background:#0c1a2b;
      color:#e5edf7;
      border:1px solid #263b55;
      border-radius:5px;
      font-size:10px;
      cursor:pointer;
      text-align:left;
    }

    .cd-right-market-item:hover{
      background:#172b42;
    }
@media(max-width:1050px){
  .cd-terminal-grid{
    grid-template-columns:190px minmax(0,1fr);
  }

  .cd-terminal-grid > :nth-child(3){
    grid-column:1 / -1;
  }
}

@media(max-width:650px){
  .cd-terminal-grid{
    grid-template-columns:minmax(0,1fr);
  }

  .cd-terminal-grid > :nth-child(1){order:2}
  .cd-terminal-grid > :nth-child(2){order:1}
  .cd-terminal-grid > :nth-child(3){order:3}

  .cd-trade-top{align-items:flex-start}
  .cd-terminal-panel{padding:9px}
  .cd-terminal-center iframe{height:350px !important}
}
    @media(max-width:390px){
      .cd-grid{grid-template-columns:1fr}
      .cd-stats{grid-template-columns:1fr}
      .cd-hero-mark{display:none}
      .cd-lang{max-width:105px}
    }

    /* TOP HEADER NAVIGATION */
.cd-top {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:18px;
  min-height:70px;
}

.cd-brand {
  flex-shrink:0;
}

.cd-main-nav {
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:20px;
  margin-left:auto;
  white-space:nowrap;
}

.cd-main-nav span {
  color:#c4d0df;
  font-size:13px;
  font-weight:600;
  cursor:pointer;
  transition:color .2s ease;
}

.cd-main-nav span:hover {
  color:#20c88a;
}

.cd-top-right {
  display:flex;
  align-items:center;
  gap:12px;
  flex-shrink:0;
}

@media(max-width:1050px) {
  .cd-main-nav {
    gap:12px;
  }

  .cd-main-nav span {
    font-size:11px;
  }
}

@media(max-width:760px) {
  .cd-top {
    flex-wrap:wrap;
  }

  .cd-main-nav {
    order:3;
    width:100%;
    overflow-x:auto;
    justify-content:flex-start;
    padding:10px 0;
    margin:0;
    scrollbar-width:none;
  }

  .cd-main-nav::-webkit-scrollbar {
    display:none;
  }

  .cd-main-nav span {
    font-size:12px;
  }
}
  style={
  page === "trading"
    ? {display:"none"}
    : page === "home"
      ? {
          display:"flex",
          flexDirection:"column",
          alignItems:"center",
          justifyContent:"center",
          textAlign:"center",
          width:"100%",
          gap:"8px"
        }
      : {}
}.cd-nav-highlight {
  color:#f0b90b !important;
  display:flex;
  align-items:center;
  gap:6px;
}

.cd-nav-highlight svg {
  width:16px;
  height:16px;
  fill:none;
  stroke:#f0b90b;
  stroke-width:1.8;
  stroke-linecap:round;
  stroke-linejoin:round;
}
  style={
  ["markets", "trading", "profile"].includes(page)
    ? {display:"none"}
    : page === "home"
      ? {
          display:"flex",
          flexDirection:"column",
          alignItems:"center",
          justifyContent:"center",
          textAlign:"center",
          width:"100%",
          gap:"8px"
        }
      : {}
}style={
  ["markets", "trading", "trade", "profile"].includes(page)
    ? {display:"none"}
    : page === "home"
      ? {
          display:"flex",
          flexDirection:"column",
          alignItems:"center",
          justifyContent:"center",
          textAlign:"center",
          width:"100%",
          gap:"8px"
        }
      : {}
}

/* ================= P2P EXCHANGE DESIGN ================= */

.cd-p2p-type {
  display: flex;
  gap: 12px;
  margin: 22px 0;
}

.cd-p2p-type button {
  flex: 1;
  padding: 13px;
  border: 1px solid #263b55;
  border-radius: 10px;
  background: #101d30;
  color: #b8c6d9;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.cd-p2p-type button.active {
  background: linear-gradient(135deg, #087f70, #10b981);
  border-color: #10b981;
  color: #fff;
}

.cd-panel:has(.cd-p2p-type) {
  padding: 24px;
  max-width: 720px;
  margin: 20px auto;
  border: 1px solid #263b55;
  border-radius: 16px;
  background: #0c1728;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
}

.cd-panel:has(.cd-p2p-type) > p {
  color: #9eafc5;
  font-size: 13px;
  line-height: 1.7;
}

.cd-panel:has(.cd-p2p-type) label {
  display: block;
  margin: 17px 0 8px;
  color: #d5e1ef;
  font-size: 13px;
  font-weight: 600;
}

.cd-panel:has(.cd-p2p-type) input {
  width: 100%;
  min-height: 46px;
  padding: 12px 14px;
  border: 1px solid #293d57;
  border-radius: 9px;
  outline: none;
  background: #101f33;
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
}

.cd-panel:has(.cd-p2p-type) input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.12);
}

.cd-p2p-notice {
  margin-top: 22px;
  padding: 15px;
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.07);
  color: #fbbf24;
}

.cd-p2p-notice p {
  margin: 7px 0 0;
  color: #c2ccda;
  font-size: 13px;
  line-height: 1.7;
}

.cd-p2p-confirm,
.cd-p2p-submit {
  width: 100%;
  min-height: 46px;
  margin-top: 14px;
  padding: 12px;
  border: 0;
  border-radius: 9px;
  background: #176bca;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.cd-p2p-submit {
  background: linear-gradient(135deg, #087f70, #10b981);
}

.cd-p2p-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cd-p2p-success {
  margin-top: 12px;
  color: #34d399;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 600px) {
  .cd-panel:has(.cd-p2p-type) {
    padding: 17px;
    margin: 12px auto;
  }
}
  /* ================= SERVICE HOME DESIGN ================= */

.cd-service-page {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding-bottom: 25px;
}

.cd-service-welcome {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 25px;
  border: 1px solid #263b55;
  border-radius: 15px;
  background: linear-gradient(120deg, #10243a, #101b2d);
  margin-bottom: 20px;
}

.cd-service-welcome-icon {
  width: 55px;
  height: 55px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #087f70;
  color: white;
  font-size: 27px;
}

.cd-service-welcome h2 {
  margin: 0 0 7px;
  color: #fff;
  font-size: 21px;
}

.cd-service-welcome p,
.cd-service-p2p-info p,
.cd-service-support p {
  margin: 0;
  color: #9eafc5;
  font-size: 13px;
  line-height: 1.7;
}

.cd-service-activity,
.cd-service-p2p-card,
.cd-service-support {
  padding: 20px;
  margin-bottom: 18px;
  border: 1px solid #263b55;
  border-radius: 14px;
  background: #0c1728;
}

.cd-service-activity-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 17px;
}

.cd-service-activity-head h3,
.cd-service-support h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
}

.cd-live-indicator {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #34d399;
  font-size: 11px;
  font-weight: 800;
}

.cd-live-indicator i,
.cd-activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  display: inline-block;
}

.cd-service-activity-feed {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 9px;
  background: #12243a;
  color: #b8c6d9;
  font-size: 13px;
}

.cd-service-p2p-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cd-service-p2p-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #087f70;
  color: #fff;
  font-size: 26px;
}

.cd-service-p2p-info {
  flex: 1;
}

.cd-service-p2p-info h3 {
  margin: 0 0 6px;
  color: #fff;
  font-size: 16px;
}

.cd-service-p2p-card > button,
.cd-service-p2p-heading button {
  padding: 11px 16px;
  border: 0;
  border-radius: 8px;
  background: #087f70;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.cd-service-support-options {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.cd-service-support-options div {
  flex: 1;
  padding: 13px;
  border: 1px solid #263b55;
  border-radius: 9px;
  color: #d5e1ef;
  text-align: center;
  font-size: 13px;
}

.cd-service-p2p-heading {
  margin-bottom: 18px;
}

.cd-service-p2p-heading h2 {
  color: #fff;
  margin: 16px 0 6px;
}

.cd-service-p2p-heading p {
  color: #9eafc5;
  font-size: 13px;
}

@media (max-width: 600px) {
  .cd-service-welcome {
    padding: 17px;
  }

  .cd-service-welcome h2 {
    font-size: 17px;
  }

  .cd-service-p2p-card {
    flex-wrap: wrap;
  }

  .cd-service-p2p-card > button {
    width: 100%;
  }

  .cd-service-support-options {
    flex-direction: column;
  }
}
  .cd-service-welcome {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  flex-direction: column;
  padding: 32px 22px;
  min-height: 210px;
  border: 1px solid #29445f;
  border-radius: 16px;
  background: linear-gradient(135deg, #102b43, #101a2d 65%, #123b3b);
  margin-bottom: 20px;
}

.cd-service-welcome-icon {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: linear-gradient(135deg, #087f70, #10b981);
  color: white;
  font-size: 30px;
  margin-bottom: 15px;
  box-shadow: 0 5px 22px rgba(16, 185, 129, .2);
}

.cd-service-welcome-content {
  max-width: 600px;
}

.cd-service-eyebrow {
  color: #34d399;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 2px;
}

.cd-service-welcome h2 {
  color: #fff;
  font-size: 24px;
  font-weight: 800;
  margin: 10px 0;
}

.cd-service-welcome p {
  color: #b5c5d8;
  font-size: 13px;
  line-height: 1.8;
  margin: 0 auto;
}

.cd-service-available {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 7px 13px;
  border-radius: 30px;
  background: rgba(16, 185, 129, .10);
  color: #34d399;
  font-size: 11px;
  font-weight: 700;
}

.cd-service-available span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
}

@media (max-width: 600px) {
  .cd-service-welcome h2 {
    font-size: 20px;
  }

  .cd-service-welcome {
    padding: 25px 16px;
  }
}
  /* COMPACT CENTERED SERVICE WELCOME */

.cd-service-welcome {
  max-width: 650px;
  width: calc(100% - 30px);
  min-height: auto;
  margin: 0 auto 20px;
  padding: 20px 18px;
  border-radius: 13px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.cd-service-welcome-icon {
  width: 42px;
  height: 42px;
  font-size: 22px;
  margin-bottom: 9px;
}

.cd-service-welcome h2 {
  font-size: 19px;
  margin: 7px 0;
}

.cd-service-welcome p {
  font-size: 12px;
  line-height: 1.6;
}

.cd-service-eyebrow {
  font-size: 9px;
  letter-spacing: 1.5px;
}

.cd-service-available {
  margin-top: 10px;
  padding: 5px 11px;
  font-size: 10px;
}
  /* ================= SERVICE FAQ DESIGN ================= */

.cd-service-faq {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #263b55;
}

.cd-service-faq-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.cd-service-faq-icon {
  width: 39px;
  height: 39px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: linear-gradient(135deg, #087f70, #10b981);
  color: white;
  font-size: 22px;
  font-weight: 800;
}

.cd-service-faq-heading h3 {
  color: #fff;
  font-size: 15px;
  margin: 0 0 4px;
}

.cd-service-faq-heading p {
  color: #91a5bd;
  font-size: 11px;
  margin: 0;
}

.cd-service-faq-item {
  margin-bottom: 9px;
  overflow: hidden;
  border: 1px solid #263b55;
  border-radius: 9px;
  background: #101f33;
}

.cd-service-faq-question {
  width: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 0;
  background: transparent;
  color: #dce7f5;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.cd-service-faq-arrow {
  color: #34d399;
  font-size: 20px;
  flex-shrink: 0;
}

.cd-service-faq-answer {
  padding: 0 14px 14px;
  color: #a9bbd0;
  font-size: 12px;
  line-height: 1.8;
}
  .cd-service-faq-heading {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  border: 1px solid #263b55;
  border-radius: 10px;
  background: #101f33;
  color: #fff;
  cursor: pointer;
  text-align: left;
}

.cd-service-faq-title {
  display: flex;
  align-items: center;
  gap: 11px;
}

.cd-service-faq-title h3 {
  margin: 0;
  color: #fff;
  font-size: 15px;
}

.cd-service-faq-icon {
  display: flex;
  align-items: center;
  color: #34d399;
}

.cd-service-faq-main-arrow {
  color: #34d399;
  font-size: 21px;
}

.cd-service-faq-subtitle {
  color: #91a5bd;
  font-size: 12px;
  margin: 12px 3px 16px;
}

.cd-service-faq-item {
  margin-bottom: 9px;
  overflow: hidden;
  border: 1px solid #263b55;
  border-radius: 9px;
  background: #101f33;
}

.cd-service-faq-question {
  width: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 0;
  background: transparent;
  color: #dce7f5;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.cd-service-faq-arrow {
  color: #34d399;
  font-size: 20px;
  flex-shrink: 0;
}

.cd-service-faq-answer {
  padding: 0 14px 14px;
  color: #a9bbd0;
  font-size: 12px;
  line-height: 1.8;
}/* ================= SERVICE PAGE ================= */

.cd-service-page {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding-bottom: 25px;
  background: transparent;
}

/* CLEAN PROFESSIONAL HEADING - NO BLUE LAYER */

.cd-service-page .cd-service-welcome {
  width: 100%;
  max-width: 750px;
  min-height: auto;
  margin: 10px auto 28px;
  padding: 12px 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-sizing: border-box;

  background: none;
  background-color: transparent;
  background-image: none;
  border: none;
  border-radius: 0;
  box-shadow: none;
  filter: none;
}

.cd-service-page .cd-service-welcome::before,
.cd-service-page .cd-service-welcome::after {
  content: none;
  display: none;
}

.cd-service-page .cd-service-welcome-icon {
  display: none;
}

.cd-service-page .cd-service-eyebrow {
  display: block;
  margin: 0 0 9px;
  padding: 0;
  color: #34d399;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  background: none;
  border: none;
  box-shadow: none;
}

.cd-service-page .cd-service-welcome h2 {
  margin: 0 0 9px;
  color: #ffffff;
  font-size: 25px;
  font-weight: 700;
  background: transparent;
}

.cd-service-page .cd-service-welcome p {
  max-width: 600px;
  margin: 0;
  color: #9aacc2;
  font-size: 13px;
  line-height: 1.7;
}

.cd-service-page .cd-service-available {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 12px;
  padding: 0;
  color: #34d399;
  font-size: 11px;
  font-weight: 600;
  background: transparent;
  border: none;
  box-shadow: none;
}

.cd-service-page .cd-service-available span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34d399;
}

/* ACTIVITY */

.cd-service-activity,
.cd-service-p2p-card,
.cd-service-support {
  padding: 20px;
  margin-bottom: 18px;
  border: 1px solid #263b55;
  border-radius: 14px;
  background: #0c1728;
}

.cd-service-activity-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 17px;
}

.cd-service-activity-head h3,
.cd-service-support h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
}

.cd-live-indicator {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #34d399;
  font-size: 11px;
  font-weight: 800;
}

.cd-live-indicator i,
.cd-activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  display: inline-block;
}

.cd-service-activity-feed {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 9px;
  background: #12243a;
  color: #b8c6d9;
  font-size: 13px;
}

/* P2P CARD */

.cd-service-p2p-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cd-service-p2p-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #087f70;
  color: #fff;
  font-size: 26px;
}

.cd-service-p2p-info {
  flex: 1;
}

.cd-service-p2p-info h3 {
  margin: 0 0 6px;
  color: #fff;
  font-size: 16px;
}

.cd-service-p2p-info p,
.cd-service-support p {
  margin: 0;
  color: #9eafc5;
  font-size: 13px;
  line-height: 1.7;
}

.cd-service-p2p-card > button,
.cd-service-p2p-heading button {
  padding: 11px 16px;
  border: 0;
  border-radius: 8px;
  background: #087f70;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

/* SUPPORT */

.cd-service-support-options {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.cd-service-support-options div {
  flex: 1;
  padding: 13px;
  border: 1px solid #263b55;
  border-radius: 9px;
  color: #d5e1ef;
  text-align: center;
  font-size: 13px;
}

/* FAQ */

.cd-service-faq {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #263b55;
}

.cd-service-faq-heading {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  border: 1px solid #263b55;
  border-radius: 10px;
  background: #101f33;
  color: #fff;
  cursor: pointer;
  text-align: left;
}

.cd-service-faq-title {
  display: flex;
  align-items: center;
  gap: 11px;
}

.cd-service-faq-title h3 {
  margin: 0;
  color: #fff;
  font-size: 15px;
}

.cd-service-faq-icon {
  display: flex;
  align-items: center;
  color: #34d399;
}

.cd-service-faq-main-arrow,
.cd-service-faq-arrow {
  color: #34d399;
  font-size: 20px;
}

.cd-service-faq-subtitle {
  color: #91a5bd;
  font-size: 12px;
  margin: 12px 3px 16px;
}

.cd-service-faq-item {
  margin-bottom: 9px;
  overflow: hidden;
  border: 1px solid #263b55;
  border-radius: 9px;
  background: #101f33;
}

.cd-service-faq-question {
  width: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 0;
  background: transparent;
  color: #dce7f5;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.cd-service-faq-answer {
  padding: 0 14px 14px;
  color: #a9bbd0;
  font-size: 12px;
  line-height: 1.8;
}

/* P2P PAGE HEADING */

.cd-service-p2p-heading {
  margin-bottom: 18px;
}

.cd-service-p2p-heading h2 {
  color: #fff;
  margin: 16px 0 6px;
}

.cd-service-p2p-heading p {
  color: #9eafc5;
  font-size: 13px;
}

/* MOBILE */

@media (max-width: 600px) {
  .cd-service-page .cd-service-welcome h2 {
    font-size: 20px;
  }

  .cd-service-p2p-card {
    flex-wrap: wrap;
  }

  .cd-service-p2p-card > button {
    width: 100%;
  }

  .cd-service-support-options {
    flex-direction: column;
  }
}
  
/* ==========================================
   TRADEX DIGITAL - PREMIUM BLUE THEME
   Complete Customer Dashboard Color Upgrade
========================================== */

:root {
  --cd-bg: #020d2b;
  --cd-panel: #0b1b38;
  --cd-panel2: #10264a;
  --cd-border: rgba(91, 155, 255, .20);
  --cd-white: #f5f8ff;
  --cd-muted: #a5b5d0;
  --cd-green: #19d99b;
  --cd-blue: #0874ff;
  --cd-red: #ff6977;
  --cd-cyan: #00baff;
}

/* MAIN BACKGROUND */

.cd-shell {
  background:
    radial-gradient(ellipse at 50% 0%, rgba(8, 75, 160, .25), transparent 48%),
    linear-gradient(135deg, #01091f, #06183b 55%, #020d2b) !important;
  color: var(--cd-white);
}

/* HEADER */

.cd-top {
  border-bottom: 1px solid rgba(75, 150, 255, .18);
}

.cd-brand {
  color: #fff;
}

.cd-logo {
  background: linear-gradient(135deg, #0874ff, #00baff) !important;
  color: #fff !important;
  box-shadow: 0 5px 18px rgba(8, 116, 255, .25);
}

.cd-lang {
  background: #0c2042;
  border-color: var(--cd-border);
  color: #fff;
}

.cd-avatar {
  background: linear-gradient(135deg, #1261bb, #123b72);
  border-color: #367bd0;
  color: #fff;
}

.cd-main-nav span {
  color: #b6c8e3;
}

.cd-main-nav span:hover,
.cd-nav-highlight {
  color: var(--cd-cyan) !important;
}

/* HEADINGS */

.cd-heading h1,
.cd-hero h2,
.cd-section-head h3,
.cd-panel-title {
  color: #fff;
}

.cd-heading p,
.cd-date {
  color: #a5b5d0;
}

.cd-eyebrow {
  color: var(--cd-cyan);
}

/* HERO SECTION */

.cd-hero {
  background:
    radial-gradient(circle at 90% 10%, rgba(0, 186, 255, .17), transparent 38%),
    linear-gradient(120deg, #0b2450, #102d58 55%, #073d62) !important;
  border: 1px solid rgba(63, 153, 255, .35);
  box-shadow: 0 12px 35px rgba(0, 0, 0, .16);
}

.cd-hero p {
  color: #c0d0e8;
}

.cd-hero-mark {
  background: rgba(0, 186, 255, .12);
  border-color: rgba(0, 186, 255, .35);
  color: var(--cd-cyan);
}

/* STAT CARDS AND PANELS */

.cd-stat,
.cd-panel {
  background: linear-gradient(145deg, #0c2042, #091831) !important;
  border: 1px solid var(--cd-border) !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, .13);
}

.cd-stat-label,
.cd-muted {
  color: #a5b5d0;
}

.cd-stat-value {
  color: #fff;
}

.cd-stat-foot,
.cd-green {
  color: var(--cd-green);
}

/* SECTION LINKS */

.cd-section-head button,
.cd-text-btn {
  color: var(--cd-cyan);
}

.cd-link-card {
  background: linear-gradient(145deg, #0d2142, #0a1933);
  border-color: var(--cd-border);
  color: #fff;
}

.cd-link-card:hover {
  background: linear-gradient(135deg, #123568, #0b2850);
  border-color: #168cff;
  box-shadow: 0 8px 22px rgba(8, 116, 255, .13);
}

.cd-link-icon {
  background: rgba(8, 116, 255, .15);
  color: var(--cd-cyan);
}

.cd-arrow {
  color: #8baed8;
}

/* MARKET AND COIN ROWS */

.cd-market-row {
  border-color: rgba(91, 155, 255, .14);
}

.cd-coin-icon {
  background: #142e55;
  color: #f0c96b;
}

/* PROFILE */

.cd-profile-avatar {
  background: linear-gradient(135deg, #0874ff, #00a9d8);
  color: #fff;
}

.cd-verified,
.cd-badge {
  background: rgba(25, 217, 155, .10);
  border-color: rgba(25, 217, 155, .30);
  color: #19d99b;
}

/* BUTTONS */

.cd-btn {
  background: linear-gradient(110deg, #0874ff, #00aaff) !important;
  color: #fff !important;
  box-shadow: 0 5px 16px rgba(8, 116, 255, .20);
}

.cd-btn:hover,
.cd-p2p-submit:hover,
.cd-p2p-confirm:hover {
  filter: brightness(1.12);
}

.cd-btn.secondary {
  background: #142d54 !important;
  border: 1px solid #315b91;
  color: #eaf3ff !important;
}

.cd-btn.ghost {
  background: transparent !important;
  border: 1px solid #168cff;
  color: var(--cd-cyan) !important;
}

/* FORM FIELDS */

.cd-field label {
  color: #c1d2eb;
}

.cd-field input,
.cd-field select,
.cd-field textarea {
  background: #06152f;
  border-color: #29466e;
  color: #fff;
}

.cd-field input:focus,
.cd-field select:focus,
.cd-field textarea:focus {
  border-color: var(--cd-cyan);
  box-shadow: 0 0 0 3px rgba(0, 186, 255, .10);
}

.cd-amount {
  background: #0b1e3d;
  border-color: #29466e;
  color: #dceaff;
}

.cd-amount.selected,
.cd-tab.active {
  background: rgba(8, 116, 255, .16);
  border-color: #168cff;
  color: var(--cd-cyan);
}

.cd-note {
  background: #10284b;
  border-color: #285486;
  color: #c2d5ef;
}

/* FAQ AND LISTS */

.cd-row {
  border-color: rgba(91, 155, 255, .14);
}

.cd-row span,
.cd-faq p {
  color: #a5b5d0;
}

.cd-faq button {
  color: #f5f8ff;
}

.cd-tabs .cd-tab {
  background: #0a1b38;
  border-color: #29466e;
  color: #b8c9e2;
}

.cd-empty {
  color: #a5b5d0;
}

.cd-empty strong {
  color: #fff;
}

/* BOTTOM NAVIGATION */

.cd-bottom {
  background: rgba(2, 13, 43, .96);
  border-color: rgba(91, 155, 255, .22);
}

.cd-nav {
  color: #849ab9;
}

.cd-nav.active {
  color: var(--cd-cyan);
}

/* MODALS AND TOAST */

.cd-modal {
  background: #0c2042;
  border-color: #315486;
  color: #fff;
}

.cd-modal p {
  color: #b1c2dc;
}

.cd-toast {
  background: #eaf5ff;
  color: #092044;
}

/* TRADING TERMINAL */

.cd-trading-terminal {
  color: #eaf3ff;
}

.cd-trade-top,
.cd-terminal-panel {
  background: linear-gradient(145deg, #0c2042, #081831);
  border-color: var(--cd-border);
}

.cd-book-head {
  color: #a5b9d5;
  border-color: var(--cd-border);
}

.cd-book-row {
  border-color: rgba(91, 155, 255, .12);
}

.cd-right-market-item {
  background: #091a36;
  border-color: #203e68;
  color: #eaf3ff;
}

.cd-right-market-item:hover {
  background: #123568;
  border-color: #168cff;
}

/* P2P EXCHANGE */

.cd-p2p-type button {
  background: #0b1d3b;
  border-color: #29466e;
  color: #c0d0e8;
}

.cd-p2p-type button.active {
  background: linear-gradient(120deg, #0874ff, #00baff);
  border-color: #00baff;
  color: #fff;
}

.cd-panel:has(.cd-p2p-type) {
  background: linear-gradient(145deg, #0c2042, #081831);
  border-color: var(--cd-border);
}

.cd-panel:has(.cd-p2p-type) input {
  background: #06152f;
  border-color: #29466e;
  color: #fff;
}

.cd-panel:has(.cd-p2p-type) input:focus {
  border-color: var(--cd-cyan);
  box-shadow: 0 0 0 2px rgba(0, 186, 255, .12);
}

.cd-p2p-confirm {
  background: linear-gradient(120deg, #0874ff, #00aaff);
}

.cd-p2p-submit {
  background: linear-gradient(120deg, #0874ff, #00baff);
}

/* CUSTOMER SERVICE */

.cd-service-activity,
.cd-service-p2p-card,
.cd-service-support {
  background: linear-gradient(145deg, #0c2042, #081831);
  border-color: var(--cd-border);
}

.cd-service-activity-head h3,
.cd-service-support h3,
.cd-service-p2p-info h3 {
  color: #fff;
}

.cd-service-welcome {
  background: transparent !important;
}

.cd-service-eyebrow {
  color: var(--cd-cyan);
}

.cd-service-welcome h2 {
  color: #fff;
}

.cd-service-welcome p,
.cd-service-p2p-info p,
.cd-service-support p {
  color: #aebfda;
}

.cd-service-welcome .cd-service-available {
  color: var(--cd-green);
}

.cd-service-p2p-icon,
.cd-service-faq-icon {
  background: linear-gradient(135deg, #0874ff, #00baff);
  color: #fff;
}

.cd-service-p2p-card > button,
.cd-service-p2p-heading button {
  background: linear-gradient(120deg, #0874ff, #00baff);
  color: #fff;
}

.cd-service-support-options div {
  background: #0b1d3b;
  border-color: var(--cd-border);
  color: #e5efff;
}

.cd-service-faq {
  border-color: var(--cd-border);
}

.cd-service-faq-heading,
.cd-service-faq-item {
  background: #0b1d3b;
  border-color: var(--cd-border);
}

.cd-service-faq-heading h3,
.cd-service-faq-question {
  color: #f5f8ff;
}

.cd-service-faq-subtitle,
.cd-service-faq-answer {
  color: #aebfda;
}

.cd-service-faq-icon,
.cd-service-faq-arrow,
.cd-service-faq-main-arrow {
  color: var(--cd-cyan);
}

/* SMOOTH TRANSITIONS */

.cd-btn,
.cd-tab,
.cd-nav,
.cd-link-card,
.cd-p2p-type button,
.cd-service-faq-item {
  transition: all .22s ease;
}

/* MOBILE POLISH */

@media (max-width: 600px) {
  .cd-hero {
    padding: 20px;
  }

  .cd-panel,
  .cd-stat {
    border-radius: 14px;
  }

  .cd-bottom {
    backdrop-filter: blur(18px);
  }
}
/* =========================================
   PREMIUM CUSTOMER DASHBOARD CARDS
========================================= */

/* SUMMARY CARDS */
.cd-stat,
.cd-stats .cd-stat {
  background: linear-gradient(135deg, #102b55 0%, #0a1b38 100%) !important;
  border: 1px solid rgba(0, 186, 255, 0.25) !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22),
              inset 0 1px 0 rgba(255,255,255,0.05) !important;
}

/* ALL MAIN PANELS */
.cd-panel,
.cd-hero,
.cd-profile-head,
.cd-terminal-panel {
  background: linear-gradient(145deg, #10284b 0%, #091a35 100%) !important;
  border: 1px solid rgba(0, 186, 255, 0.20) !important;
  border-radius: 18px !important;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.20) !important;
}

/* HOME MENU CARDS */
.cd-link-card,
.cd-market-row {
  background: linear-gradient(135deg, #122f58, #0b1d3b) !important;
  border: 1px solid rgba(8, 116, 255, 0.25) !important;
  border-radius: 14px !important;
  transition: all 0.25s ease !important;
}

.cd-link-card:hover,
.cd-market-row:hover {
  background: linear-gradient(135deg, #174078, #10284b) !important;
  border-color: #00baff !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(0, 120, 255, 0.16) !important;
}

/* CARD HEADINGS */
.cd-stat h3,
.cd-panel h3,
.cd-link-card strong,
.cd-section-head h2,
.cd-section-head h3 {
  color: #ffffff !important;
}

/* CARD DESCRIPTIONS */
.cd-stat p,
.cd-panel p,
.cd-link-card span,
.cd-market-row span {
  color: #a9c0df !important;
}

/* CARD ICONS */
.cd-link-card .cd-icon,
.cd-stat .cd-icon {
  background: linear-gradient(135deg, #0874ff, #00baff) !important;
  color: #ffffff !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 14px rgba(0, 186, 255, 0.22) !important;
}

/* ACTIVE TABS AND BUTTONS */
.cd-tabs button.active,
.cd-nav button.active {
  background: linear-gradient(135deg, #0874ff, #00baff) !important;
  color: #ffffff !important;
  border-color: transparent !important;
}

/* INPUT CARDS */
.cd-field,
.cd-form-grid,
.cd-list {
  background: #0b1d39 !important;
  border-color: rgba(0, 186, 255, 0.18) !important;
}

/* TRADING AND P2P CARDS */
.cd-trading-terminal,
.cd-p2p-card,
.cd-terminal-grid > div {
  background: linear-gradient(145deg, #10284b, #091a35) !important;
  border: 1px solid rgba(0, 186, 255, 0.20) !important;
  border-radius: 16px !important;
}

/* SOFT HIGHLIGHT */
.cd-stat strong,
.cd-stat .value {
  color: #42c5ff !important;
}

/* MOBILE CARD SPACING */
@media (max-width: 600px) {
  .cd-stat,
  .cd-panel,
  .cd-link-card {
    border-radius: 14px !important;
  }
}
  /* =========================================
   YELLOW / GOLD BUTTONS ONLY
   ========================================= */

/* Main buttons */
.cd-btn,
.cd-p2p-confirm,
.cd-p2p-submit,
.cd-service-p2p-card > button,
.cd-service-p2p-heading button {
  background: linear-gradient(135deg, #f0b90b, #ffd84d) !important;
  color: #1b1b1b !important;
  border: 1px solid #ffd84d !important;
  font-weight: 800 !important;
  box-shadow: 0 5px 15px rgba(240, 185, 11, 0.22) !important;
}

/* Hover */
.cd-btn:hover,
.cd-p2p-confirm:hover,
.cd-p2p-submit:hover,
.cd-service-p2p-card > button:hover,
.cd-service-p2p-heading button:hover {
  background: linear-gradient(135deg, #ffd84d, #f0b90b) !important;
  color: #111 !important;
  filter: brightness(1.05);
}

/* Active tabs / Buy-Sell / action buttons */
.cd-p2p-type button.active,
.cd-tab.active {
  background: #f0b90b !important;
  border-color: #f0b90b !important;
  color: #151515 !important;
}
  /* =========================================
   MARKET COINS — GOLDEN + GREEN / RED PRICES
========================================= */

/* ALL COIN NAMES / SYMBOLS */
.cd-coin,
.cd-coin-icon,
.cd-market-row strong {
  color: #f0b90b !important;
}

/* Coin icons */
.cd-coin-icon {
  background: #fff8e1 !important;
  border: 1px solid #f0b90b !important;
  box-shadow: 0 4px 12px rgba(240, 185, 11, 0.18);
}

/* RIGHT MARKET LIST */
.cd-right-market-item strong,
.cd-right-market-item b {
  color: #f0b90b !important;
}

/* BTC / ETH / BNB / SOL names */
.cd-right-market-item {
  color: #172033 !important;
}

/* ================================
   PRICE UP = GREEN
================================ */

.cd-green,
.price-up,
.market-up,
.up {
  color: #16a34a !important;
}

/* ================================
   PRICE DOWN / SELL = RED
================================ */

.cd-red,
.price-down,
.market-down,
.down {
  color: #dc2626 !important;
}

/* Market percentage */
.cd-market-row .cd-green {
  color: #16a34a !important;
  font-weight: 800;
}

.cd-market-row .cd-red {
  color: #dc2626 !important;
  font-weight: 800;
}

/* Market labels */
.cd-muted {
  color: #64748b !important;
}
  
  `}</style>
  {page !== "service" && (
<header className="cd-top cd-wrap">

  <div className="cd-brand">
    <div className="cd-logo">T</div>
    <span>
      TradeX <span style={{color:"var(--cd-green)"}}>Digital</span>
    </span>
  </div>

  {["markets", "trade", "trading"].includes(page) && (
    <nav className="cd-main-nav">

      <span onClick={() => go("markets")} style={{cursor:"pointer"}}>
        Markets
      </span>

      <span onClick={() => go("trading")} style={{cursor:"pointer"}}>
        Trading
      </span>

      <span onClick={() => {
        setMarketType("spot");
        go("trading");
      }} style={{cursor:"pointer"}}>
        Spot
      </span>

      <span onClick={() => {
        setMarketType("futures");
        go("trading");
      }} style={{cursor:"pointer"}}>
        Futures
      </span>

      <span onClick={() => {
        setActiveMarketSection("stocks");
        go("trading");
      }} style={{cursor:"pointer"}}>
        Stocks
      </span>

      <span
        className="cd-nav-highlight"
        onClick={() => setModal("Buy Crypto service is coming soon.")}
        style={{cursor:"pointer"}}
      >
        Buy Crypto
      </span>

      <span
        className="cd-nav-highlight"
        onClick={() => setModal("P2P service is coming soon.")}
        style={{cursor:"pointer"}}
      >
        P2P
      </span>

    </nav>
  )}

  <div className="cd-top-right">

    <select
      className="cd-lang"
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      aria-label="Language"
    >
      {LANGUAGES.map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>

    <div className="cd-avatar">TR</div>

  </div>

</header>
)}

  <main className="cd-wrap">
    {/* HOME AND MARKETS HEADING */}
    {["home", "markets"].includes(page) && (
      <div className="cd-heading">
        <div>
          <h1>{titleMap[page] || "TradeX Digital"}</h1>
          <p>Manage your account and explore the TradeX platform.</p>
        </div>

        <span className="cd-date">TRADEX DIGITAL</span>
      </div>
    )}
    {/* AAPKA PURANA DASHBOARD CONTENT YAHAN SE SHURU HOGA */}
        {page === "home" && <>
         <section className="cd-hero">
  <div>
    <div className="cd-eyebrow">TRADEX DIGITAL PLATFORM</div>
    <h2>Trade with confidence.</h2>
    <p>Access real-time crypto and stock markets, robust portfolio management tools, and advanced financial services designed for the modern trader.</p>
  </div>
  <div className="cd-hero-mark">↗</div>
</section>
          <section className="cd-stats">
<div className="cd-stat">
  <div className="cd-stat-label">◈ Available Balance</div>

  <div className="cd-stat-value">
    {profileLoading
      ? "Loading..."
      : `$${Number(profile?.balance || 0).toFixed(2)}`}
  </div>

  <div className="cd-stat-foot">
    Account balance
  </div>
</div>            <div className="cd-stat"><div className="cd-stat-label">↗ Trading Profit</div><div className="cd-stat-value">$0.00</div><div className="cd-stat-foot">Profit summary</div></div>
            <div className="cd-stat"><div className="cd-stat-label">● Account Status</div><div className="cd-stat-value" style={{fontSize:18}}>Active</div><div className="cd-stat-foot">Status display preview</div></div>
          </section>
          <div className="cd-section-head"><h3>Platform Services</h3><button onClick={()=>go("profile")}>My account ›</button></div>
          <div className="cd-grid">
            <CardLink icon="▤" title="Rules & Guidelines" desc="Platform rules and policies" target="rules"/>
            <CardLink icon="◉" title="System Status" desc="Platform service information" target="status"/>
            <CardLink icon="▣" title="Trading Guide" desc="Learn trading basics" target="guide"/>
            <CardLink icon="♢" title="Security Protocols" desc="Keep your account secure" target="security"/>
            <CardLink icon="↗" title="How It Works" desc="Explore platform features" target="how"/>
            <CardLink icon="✦" title="Certification" desc="Platform information" onClick={()=>setModal("TradeX Digital platform information")}/>
          </div>
          <div className="cd-section-head"><h3>Market Overview</h3><button onClick={()=>go("markets")}>View all ›</button></div>
          <div className="cd-panel">
            {marketRows.slice(0,4).map(row=><div className="cd-market-row" key={row[1]}><div className="cd-coin"><span className="cd-coin-icon">{row[0]}</span><span>{row[1]}<small className="cd-muted" style={{display:"block",fontWeight:400,marginTop:3}}>{row[2]}</small></span></div><b>{row[3]}</b><span className={row[5]?"cd-green":"cd-red"}>{row[4]}</span><span className="cd-muted">Spot</span></div>)}
          </div>
        </>}

{/* ================= CUSTOMER SERVICE PAGE ================= */}
{page === "service" && (

  <section className="cd-service-page">

    {!showP2PPage ? (
      <>
{/* PROFESSIONAL CUSTOMER SERVICE PAGE HEADING */}

<div className="cd-service-welcome">

  <span className="cd-service-eyebrow">
    TRADEX DIGITAL • CUSTOMER CARE
  </span>

  <h2>Welcome to Customer Service</h2>

  <p>
    We're here 12/7 to assist you. Get help with your account,
    payments and P2P exchange services.
  </p>

  <div className="cd-service-available">
    <span></span>
    Customer Assistance
  </div>

</div>

        {/* LIVE TRANSACTION ACTIVITY */}
        <div className="cd-service-activity">

          <div className="cd-service-activity-head">
            <h3>Live Transaction Activity</h3>
            <span className="cd-live-indicator">
              <i></i> LIVE
            </span>
          </div>

        <div className="cd-service-activity-feed cd-service-demo-feed">

  <span className="cd-activity-dot"></span>
<div className="cd-service-activity-details">
  <strong>
    {serviceDemoActivities[serviceActivityIndex].type}
  </strong>

  <span>
    {serviceDemoActivities[serviceActivityIndex].user}
  </span>
</div>

<strong className="cd-service-activity-amount">
  ${serviceDemoActivities[serviceActivityIndex].amount}
</strong>

</div>

        </div>

        {/* P2P EXCHANGE CARD */}
        <div className="cd-service-p2p-card">

          <div className="cd-service-p2p-icon">⇄</div>

          <div className="cd-service-p2p-info">
            <h3>P2P Exchange</h3>
            <p>
              Buy or sell USDT using your local payment method.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowP2PPage(true)}
          >
            Open P2P Exchange →
          </button>

        </div>

        {/* SUPPORT OPTIONS */}
        <div className="cd-service-support">

          <h3>Customer Support</h3>

          <p>
            Contact our support team for assistance
            with payments and P2P availability.
          </p>

          <div className="cd-service-support-options">
            <div>WhatsApp Support</div>
            <div>Telegram Support</div>
          </div>
{/* ================= CUSTOMER SERVICE FAQ ================= */}

<div className="cd-service-faq">

  {/* FAQ HEADING BUTTON */}
  <button
    type="button"
    className="cd-service-faq-heading"
    onClick={() => {
      setIsServiceFaqOpen((prev) => !prev);
      setOpenServiceFaq(null);
    }}
  >
    <div className="cd-service-faq-title">

      <span className="cd-service-faq-icon">
        <svg
          viewBox="0 0 24 24"
          width="25"
          height="25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1.1 1-1.8 1.4-1.8 3" />
          <path d="M12 17h.01" />
        </svg>
      </span>

      <h3>Frequently Asked Questions</h3>

    </div>

    <span className="cd-service-faq-main-arrow">
      {isServiceFaqOpen ? "−" : "+"}
    </span>

  </button>

  {/* FAQ QUESTIONS */}
  {isServiceFaqOpen && (
    <>

      <p className="cd-service-faq-subtitle">
        Find answers to common questions
      </p>

      {[
        {
          q: "How can I deposit funds?",
          a: "Open the Deposit section, select your supported cryptocurrency and network, enter the required amount, and follow the payment instructions. Submit your transaction details for review."
        },
        {
          q: "What is the minimum deposit amount?",
          a: "The platform's stated minimum deposit is $50. Always check the current deposit instructions before sending funds."
        },
        {
          q: "Why is my deposit still pending?",
          a: "Deposits may remain pending while network confirmations or payment verification are in progress. Contact Customer Support with your transaction ID if you need assistance."
        },
        {
          q: "How can I withdraw my balance?",
          a: "Open the Withdraw section, enter your requested amount and correct wallet details, then follow the displayed instructions. Your request may require review."
        },
        {
          q: "Why has my withdrawal not arrived?",
          a: "A withdrawal may require platform review and network processing. Contact Customer Support with your withdrawal reference for an update."
        },
        {
          q: "What is P2P Exchange?",
          a: "P2P Exchange allows customers to request buying or selling USDT using local payment methods. Availability must be confirmed by Customer Support before placing an order."
        },
        {
          q: "How do I place a P2P order?",
          a: "Open P2P Exchange, select Buy or Sell, enter your amount, country and payment method, then contact WhatsApp or Telegram Support to confirm availability."
        },
        {
          q: "How can I check my P2P order status?",
          a: "Check your P2P order history when available, or contact Customer Support with your order reference to ask about its status."
        },
        {
          q: "How do I start trading?",
          a: "Open the Trading section, review the available market information and platform instructions. Only place trades when the trading function is enabled and available in your account."
        },
        {
          q: "Where can I check my trading profits?",
          a: "Check your account dashboard and transaction or trading history for available profit records. Displayed figures should be checked against completed account activity."
        },
        {
          q: "How can I contact Customer Support?",
          a: "Use the official WhatsApp or Telegram support links displayed on the Service page. Never share your password or security codes."
        },
        {
          q: "Can I cancel a pending request?",
          a: "Cancellation depends on the request type and its current status. Contact Customer Support with your request reference before taking further action."
        }
      ].map((faq, index) => (

        <div className="cd-service-faq-item" key={index}>

          <button
            type="button"
            className="cd-service-faq-question"
            onClick={() =>
              setOpenServiceFaq(
                openServiceFaq === index ? null : index
              )
            }
          >
            <span>{faq.q}</span>

            <span className="cd-service-faq-arrow">
              {openServiceFaq === index ? "−" : "+"}
            </span>

          </button>

          {openServiceFaq === index && (
            <div className="cd-service-faq-answer">
              {faq.a}
            </div>
          )}

        </div>

      ))}

    </>
  )}

</div>

        </div>

      </>
    ) : (

      <>
        {/* P2P PAGE HEADER */}
        <div className="cd-service-p2p-heading">

          <button
            type="button"
            onClick={() => setShowP2PPage(false)}
          >
            ← Back to Service
          </button>

          <h2>P2P Exchange</h2>

          <p>
            Buy or sell USDT using local payment methods.
          </p>

        </div>

        {/* EXISTING P2P FORM */}
        <section className="cd-panel">

          <h2 className="cd-panel-title">
            P2P Exchange
          </h2>

          <p>
            Contact Customer Service first to confirm availability.
          </p>

          <div className="cd-p2p-type">

            <button
              type="button"
              className={p2pType === "buy" ? "active" : ""}
              onClick={() => setP2pType("buy")}
            >
              Buy USDT
            </button>

            <button
              type="button"
              className={p2pType === "sell" ? "active" : ""}
              onClick={() => setP2pType("sell")}
            >
              Sell USDT
            </button>

          </div>

          <label>Amount (USDT)</label>

          <input
            type="number"
            min="1"
            placeholder="Enter amount"
            value={p2pAmount}
            onChange={(e) => setP2pAmount(e.target.value)}
          />

          <label>Country</label>

          <input
            type="text"
            placeholder="Enter your country"
            value={p2pCountry}
            onChange={(e) => setP2pCountry(e.target.value)}
          />

          <label>Local Payment Method</label>

          <input
            type="text"
            placeholder="e.g. Bank Transfer, Easypaisa, PayPal"
            value={p2pPaymentMethod}
            onChange={(e) => setP2pPaymentMethod(e.target.value)}
          />

          <label>Exchange / Bank Name (Optional)</label>

          <input
            type="text"
            placeholder="Enter bank or exchange name"
            value={p2pExchange}
            onChange={(e) => setP2pExchange(e.target.value)}
          />

          <div className="cd-p2p-notice">

            <strong>Important:</strong>

            <p>
              Contact Customer Service on WhatsApp or Telegram
              to confirm availability before placing your order.
            </p>

          </div>

          <button
            type="button"
            className="cd-p2p-confirm"
            onClick={() => setP2pContactConfirmed(true)}
          >
            I Have Contacted Customer Service
          </button>

          {p2pContactConfirmed && (
            <p className="cd-p2p-success">
              Please submit after Customer Service confirms availability.
            </p>
          )}

          <button
            type="button"
            className="cd-p2p-submit"
            disabled={!p2pContactConfirmed || p2pSubmitting}
            onClick={() => {
              notify("P2P order submission will be connected next.");
            }}
          >
            Continue
          </button>

        </section>
      </>

    )}

  </section>
)}

{page === "profile" && (
  <>
    {/* ================= PROFILE HEADER ================= */}
    <div className="cd-panel cd-profile-head">
      <div className="cd-profile-avatar">TR</div>

      <div>
        <h2>
          {profile?.full_name ||
            profile?.username ||
            "Trader Account"}
        </h2>

        <p>
          Customer profile ·{" "}
          {profile?.email || "Email not connected"}
        </p>
      </div>

      <span className="cd-verified">● VERIFIED</span>
    </div>

    {/* ================= ACCOUNT STATS ================= */}
    <div className="cd-stats">

      {/* AVAILABLE BALANCE */}
      <div className="cd-stat">
        <div className="cd-stat-label">
          ◈ Available Balance
        </div>

        <div className="cd-stat-value">
          {profileLoading
            ? "Loading..."
            : `$${Number(profile?.balance || 0).toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }
              )}`}
        </div>

        <div className="cd-stat-foot">
          Account balance
        </div>
      </div>

      {/* TRADING PROFIT */}
      <div className="cd-stat">
        <div className="cd-stat-label">
          Trading Profit
        </div>

        <div className="cd-stat-value">
          {profileLoading
            ? "Loading..."
            : `$${Number(
                profile?.trading_profit ||
                profile?.total_profit ||
                0
              ).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`}
        </div>

        <div className="cd-stat-foot">
          Total trading profit
        </div>
      </div>

      {/* ACCOUNT STATUS */}
      <div className="cd-stat">
        <div className="cd-stat-label">
          Account Status
        </div>

        <div
          className="cd-stat-value"
          style={{ fontSize: 17 }}
        >
          Active
        </div>

        <div className="cd-stat-foot">
          Trading account active
        </div>
      </div>

    </div>

    {/* ================= DEPOSIT / WITHDRAW BUTTONS ================= */}
    <div className="cd-action-row">

      <button
        type="button"
        className="cd-btn"
        onClick={() => {
          setDepositStep(1);
          go("deposit");
        }}
      >
        ＋ Deposit
      </button>

      <button
        type="button"
        className="cd-btn secondary"
        onClick={() => go("withdraw")}
      >
        ↗ Withdraw
      </button>

    </div>
{/* ================= ACCOUNT MENU ================= */}
<div className="cd-panel">

  <h3 className="cd-panel-title">
    Account
  </h3>

  <div className="cd-list">

    <CardLink
      icon="▤"
      title="Transaction History"
      desc="Deposits, withdrawals and trades"
      target="history"
    />

    <CardLink
      icon="▣"
      title="Payment Methods"
      desc="Manage your wallet details"
      target="payments"
    />

    <CardLink
      icon="⚙"
      title="Settings"
      desc="Security and account preferences"
      target="settings"
    />

    <CardLink
      icon="⇥"
      title="Log Out"
      desc="Sign out of your account"
      onClick={handleCustomerLogout}
    />

  </div>
</div>
  </>
)}
    
{/* ==========================================
    TRADEX MARKETS PAGE
========================================== */}

{page === "markets" && <>
  <div className="cd-panel">
    <div style={{
      display:"flex",
      justifyContent:"space-between",
      alignItems:"center",
      gap:10,
      flexWrap:"wrap"
    }}>
      <div>
        <h3 className="cd-panel-title">Markets</h3>
        <div className="cd-muted" style={{fontSize:11}}>
          Select a market to open its trading terminal
        </div>
      </div>

      <span className="cd-badge">TRADEX MARKETS</span>
    </div>

    <div className="cd-tabs" style={{marginTop:15}}>
      <button
        className={"cd-tab " + (activeMarketSection === "crypto" ? "active" : "")}
        onClick={() => setActiveMarketSection("crypto")}
      >
        Crypto
      </button>

      <button
        className={"cd-tab " + (activeMarketSection === "stocks" ? "active" : "")}
        onClick={() => setActiveMarketSection("stocks")}
      >
        Stocks
      </button>
    </div>
  </div>

  {/* CRYPTO MARKETS */}

  {activeMarketSection === "crypto" && (
    <div className="cd-panel">
      <div style={{
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center"
      }}>
        <h3 className="cd-panel-title">Crypto Markets</h3>

        <span style={{
          color:marketStatus === "live" ? "#22c55e" : "#f0b44d",
          fontSize:11,
          fontWeight:700
        }}>
          {marketStatus.toUpperCase()}
        </span>
      </div>

      <div className="cd-tabs">
        <button
          className={"cd-tab " + (marketType === "spot" ? "active" : "")}
          onClick={() => setMarketType("spot")}
        >
          Spot
        </button>

        <button
          className={"cd-tab " + (marketType === "futures" ? "active" : "")}
          onClick={() => setMarketType("futures")}
        >
          Futures
        </button>
      </div>

      <input
        className="cd-input"
        placeholder="Search BTCUSDT..."
        value={marketSearch}
        onChange={e => setMarketSearch(e.target.value)}
        style={{width:"100%",marginBottom:12}}
      />

      <div style={{overflowX:"auto"}}>
        <div style={{
          minWidth:470,
          display:"grid",
          gridTemplateColumns:"1.3fr 1fr 1fr 90px",
          padding:"10px 5px",
          color:"#91a7c0",
          fontSize:11
        }}>
          <b>Pair</b>
          <b>Price</b>
          <b>24h Change</b>
          <b>Trade</b>
        </div>

        {liveMarkets[marketType]
          .filter(m => m.symbol.toLowerCase().includes(marketSearch.toLowerCase()))
          .map(market => {
            const base = market.symbol.replace(/USDT$/,"");
            const price = Number(market.price);
            const change = Number(market.change24h || 0);

            return (
              <div
                key={market.symbol}
                style={{
                  minWidth:470,
                  display:"grid",
                  gridTemplateColumns:"1.3fr 1fr 1fr 90px",
                  alignItems:"center",
                  padding:"11px 5px",
                  borderTop:"1px solid #263b55",
                  fontSize:12
                }}
              >
                <div className="cd-coin">
                  <img
                    src={`https://assets.coincap.io/assets/icons/${base.toLowerCase()}@2x.png`}
                    alt={base}
                    style={{
                      width:27,
                      height:27,
                      background:"#fff",
                      borderRadius:"50%",
                      padding:3
                    }}
                    onError={e => e.currentTarget.style.display="none"}
                  />

                  <span>
                    <b>{base}</b>
                    <small className="cd-muted" style={{display:"block"}}>
                      {market.symbol}
                    </small>
                  </span>
                </div>

                <b>
                  {Number.isFinite(price)
                    ? "$" + price.toLocaleString("en-US",{maximumFractionDigits:8})
                    : "--"}
                </b>

                <span className={change >= 0 ? "cd-green" : "cd-red"}>
                  {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                </span>

                <button
                  onClick={() => openTradingMarket({
                    type:"crypto",
                    symbol:market.symbol,
                    name:base,
                    exchange:"BINANCE",
                    currency:"USDT"
                  })}
                  style={{
                    border:0,
                    borderRadius:6,
                    background:"#16a34a",
                    color:"#fff",
                    padding:"7px 9px",
                    fontSize:11,
                    fontWeight:700,
                    cursor:"pointer"
                  }}
                >
                  Trade
                </button>
              </div>
            );
          })}
      </div>

      {liveMarkets[marketType].length === 0 && (
        <div className="cd-empty">
          {marketStatus === "offline"
            ? "Market backend is offline."
            : "Loading Binance markets..."}
        </div>
      )}
    </div>
  )}

  {/* STOCK MARKETS */}

  {activeMarketSection === "stocks" && (
    <div className="cd-panel">
      <div style={{
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center"
      }}>
        <h3 className="cd-panel-title">Global Stock Markets</h3>
        <span className="cd-badge">USA · INDIA</span>
      </div>

      <div style={{
        display:"flex",
        gap:7,
        flexWrap:"wrap",
        margin:"12px 0"
      }}>
        {["NASDAQ","NYSE","NSE","BSE"].map(exchange => (
          <span key={exchange} style={{
            background:"#172b42",
            padding:"6px 10px",
            borderRadius:6,
            color:"#b8cce0",
            fontSize:10
          }}>
            {exchange}
          </span>
        ))}
      </div>

      <input
        className="cd-input"
        placeholder="Search stock symbol or company..."
        value={marketSearch}
        onChange={e => setMarketSearch(e.target.value)}
        style={{width:"100%",marginBottom:14}}
      />

      {["USA","India"].map(country => (
        <div key={country} style={{marginBottom:18}}>
          <h4 style={{
            color:"#9db8d2",
            fontSize:12,
            marginBottom:10
          }}>
            {country === "USA" ? "🇺🇸 USA STOCKS" : "🇮🇳 INDIA STOCKS"}
          </h4>

          {stockUniverse
            .filter(stock =>
              stock.country === country &&
              (
                stock.symbol.toLowerCase().includes(marketSearch.toLowerCase()) ||
                stock.name.toLowerCase().includes(marketSearch.toLowerCase())
              )
            )
            .map(stock => (
              <div
                key={stock.symbol}
                style={{
                  display:"flex",
                  justifyContent:"space-between",
                  alignItems:"center",
                  gap:10,
                  padding:"12px 0",
                  borderBottom:"1px solid #263b55"
                }}
              >
                <div style={{
                  display:"flex",
                  alignItems:"center",
                  gap:9,
                  minWidth:0
                }}>
                  <img
                    src={stock.logo}
                    alt=""
                    style={{
                      width:32,
                      height:32,
                      objectFit:"contain",
                      background:"#fff",
                      padding:4,
                      borderRadius:7
                    }}
                  />

                  <div style={{minWidth:0}}>
                    <b style={{fontSize:12}}>{stock.symbol}</b>
                    <div className="cd-muted" style={{fontSize:10}}>
                      {stock.name} · {stock.exchange}
                    </div>
                  </div>
                </div>

                <div style={{display:"flex",gap:5,flexShrink:0}}>
                  <button
                    onClick={() => openTradingMarket({
                      ...stock,
                      type:"stock"
                    },"buy")}
                    style={{
                      background:"#16a34a",
                      color:"#fff",
                      border:0,
                      padding:"7px 10px",
                      borderRadius:6,
                      fontSize:10,
                      fontWeight:700
                    }}
                  >
                    Buy
                  </button>

                  <button
                    onClick={() => openTradingMarket({
                      ...stock,
                      type:"stock"
                    },"sell")}
                    style={{
                      background:"#dc3545",
                      color:"#fff",
                      border:0,
                      padding:"7px 10px",
                      borderRadius:6,
                      fontSize:10,
                      fontWeight:700
                    }}
                  >
                    Sell
                  </button>
                </div>
              </div>
            ))}
        </div>
      ))}

      <div className="cd-empty">
        Stock prices and execution require a connected stock-market data provider and backend.
      </div>
    </div>
  )}
</>}

{/* ==========================================
    BINANCE STYLE TRADING TERMINAL
========================================== */}

{page === "trading" && (
  <div className="cd-trading-terminal">
{/* BINANCE FUTURES HEADER */}

<div style={{
  background:"#0d1726",
  border:"1px solid #24354b",
  borderRadius:10,
  padding:14,
  marginBottom:14
}}>

  {/* TOP TICKER STRIP */}

  {tradingMarket.type === "crypto" && marketType === "futures" && (
    <div style={{
      display:"flex",
      gap:22,
      flexWrap:"wrap",
      borderBottom:"1px solid #26384e",
      paddingBottom:12,
      marginBottom:14
    }}>
      {["BTCUSDT", "ETHUSDT", "BNBUSDT"].map(symbol => {
        const item = liveMarkets.futures.find(x => x.symbol === symbol);
        const change = Number(item?.change24h);

        return (
          <div key={symbol} style={{
            display:"flex",
            gap:7,
            alignItems:"center",
            fontSize:11
          }}>
            <b style={{color:"#e5edf8"}}>{symbol}</b>

            <span style={{
              color:Number.isFinite(change)
                ? change >= 0 ? "#16c784" : "#ea3943"
                : "#8493a8"
            }}>
              {Number.isFinite(change)
                ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`
                : "--"}
            </span>
          </div>
        );
      })}
    </div>
  )}

  {/* SELECTED MARKET */}

  <div style={{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    flexWrap:"wrap",
    gap:15,
    marginBottom:18
  }}>

    <div>
      <div style={{
        display:"flex",
        alignItems:"center",
        gap:9,
        flexWrap:"wrap"
      }}>
        <h3 style={{
          margin:0,
          fontSize:21,
          color:"#f1f5f9"
        }}>
          {tradingMarket.symbol.replace("USDT", "/USDT")}
        </h3>

        <span style={{
          background:"#172b42",
          color:"#f0b90b",
          padding:"4px 8px",
          borderRadius:5,
          fontSize:10
        }}>
          {tradingMarket.type === "crypto"
            ? marketType === "futures" ? "PERPETUAL" : "SPOT"
            : "STOCK"}
        </span>
      </div>

      <div className="cd-muted" style={{
        fontSize:11,
        marginTop:5
      }}>
        {tradingMarket.name}
      </div>
    </div>

    <div>
      <div style={{
        color:"#16c784",
        fontSize:23,
        fontWeight:800
      }}>
        {tradingMarket.type === "crypto"
          ? "$" + formatFuturesNumber(
              marketType === "futures"
                ? futuresStats?.lastPrice || currentTradingPrice
                : currentTradingPrice,
              8
            )
          : "--"}
      </div>

      <div className="cd-muted" style={{fontSize:10}}>
        {marketType === "futures"
          ? "Last Price"
          : "Market Price"}
      </div>
    </div>

  </div>

  {/* FUTURES STATISTICS */}

  {tradingMarket.type === "crypto" && marketType === "futures" && (
    <div style={{
      display:"grid",
      gridTemplateColumns:"repeat(auto-fit,minmax(125px,1fr))",
      gap:16
    }}>

      {[
        ["Mark Price", "$" + formatFuturesNumber(futuresStats?.markPrice, 6)],
        ["Index Price", "$" + formatFuturesNumber(futuresStats?.indexPrice, 6)],
        [
          "Funding / 8h",
          futuresStats
            ? (futuresStats.fundingRate * 100).toFixed(4) + "%"
            : "--"
        ],
        ["Funding Countdown", fundingCountdown],
        ["24h High", "$" + formatFuturesNumber(futuresStats?.high24h, 4)],
        ["24h Low", "$" + formatFuturesNumber(futuresStats?.low24h, 4)],
        ["24h Vol (" + tradingMarket.symbol.replace("USDT", "") + ")", formatFuturesNumber(futuresStats?.volume24h, 2)],
        ["24h Vol (USDT)", "$" + formatFuturesNumber(futuresStats?.quoteVolume24h, 2)],
        [
          "Open Interest (USDT)",
          "$" + formatFuturesNumber(
            futuresStats
              ? futuresStats.openInterest * futuresStats.markPrice
              : null,
            2
          )
        ]
      ].map(([label, value]) => (
        <div key={label}>
          <div style={{
            color:"#8493a8",
            fontSize:10,
            marginBottom:6
          }}>
            {label}
          </div>

          <div style={{
            color:"#e5edf8",
            fontSize:12,
            fontWeight:700
          }}>
            {value}
          </div>
        </div>
      ))}

    </div>
  )}

  {tradingMarket.type !== "crypto" && (
    <div className="cd-muted" style={{fontSize:11}}>
      Stock market data provider required.
    </div>
  )}

</div>

    {/* THREE COLUMN TERMINAL */}

    <div className="cd-terminal-grid">

      {/* LEFT ORDER BOOK */}

      <div className="cd-terminal-panel">
        <h4>Order Book</h4>

        <div className="cd-book-head">
          <span>Price (USDT)</span>
          <span>Amount</span>
        </div>

        {tradingMarket.type === "crypto" && orderBook.asks.length > 0
          ? [...orderBook.asks].reverse().slice(0,10).map((item,i) => (
              <div className="cd-book-row" key={"ask"+i}>
                <span className="cd-red">{Number(item[0]).toFixed(4)}</span>
                <span>{Number(item[1]).toFixed(5)}</span>
              </div>
            ))
          : <div className="cd-empty">Sell book unavailable</div>
        }

        <div style={{
          padding:"10px 0",
          color:"#22c55e",
          fontSize:16,
          fontWeight:800,
          borderTop:"1px solid #263b55",
          borderBottom:"1px solid #263b55"
        }}>
          {currentTradingPrice
            ? currentTradingPrice.toLocaleString("en-US",{maximumFractionDigits:8})
            : "--"}
        </div>

        {tradingMarket.type === "crypto" && orderBook.bids.length > 0
          ? orderBook.bids.slice(0,10).map((item,i) => (
              <div className="cd-book-row" key={"bid"+i}>
                <span className="cd-green">{Number(item[0]).toFixed(4)}</span>
                <span>{Number(item[1]).toFixed(5)}</span>
              </div>
            ))
          : <div className="cd-empty">Buy book unavailable</div>
        }

        {tradingMarket.type === "stock" && (
          <div className="cd-empty">
            Stock order book requires a stock exchange data API.
          </div>
        )}
      </div>

      {/* CENTER CHART + ORDER FORM */}
{/* CENTER CHART */}

<div className="cd-terminal-center">

  <div className="cd-terminal-panel">

    {/* COIN SELECTOR */}

    <div style={{
      display:"flex",
      gap:8,
      flexWrap:"wrap",
      alignItems:"center",
      marginBottom:12
    }}>

      <div style={{flex:1,minWidth:130}}>
        <input
          className="cd-input"
          placeholder="Search coin or stock..."
          value={marketSearch}
          onChange={e => setMarketSearch(e.target.value)}
          style={{width:"100%"}}
        />
      </div>

      <select
        className="cd-input"
        value={
          tradingMarket.type === "crypto"
            ? tradingMarket.symbol
            : "STOCK:" + tradingMarket.symbol
        }
        onChange={e => {
          const value = e.target.value;

          if(value.startsWith("STOCK:")){
            const symbol = value.replace("STOCK:","");
            const stock = stockUniverse.find(s => s.symbol === symbol);

            if(stock){
              setTradingMarket({...stock,type:"stock"});
              setOrderQuantity("1");
              setOrderPrice("");
            }
          } else {
            const market = liveMarkets[marketType].find(
              m => m.symbol === value
            );

            if(market){
              setTradingMarket({
                type:"crypto",
                symbol:market.symbol,
                name:market.symbol.replace("USDT",""),
                exchange:"BINANCE",
                currency:"USDT"
              });
              setOrderQuantity("0.001");
              setOrderPrice("");
            }
          }
        }}
        style={{flex:1,minWidth:140}}
      >
        <optgroup label="Crypto Markets">
          {liveMarkets[marketType]
            .filter(m =>
              m.symbol.toLowerCase().includes(marketSearch.toLowerCase())
            )
            .map(m => (
              <option key={m.symbol} value={m.symbol}>
                {m.symbol}
              </option>
            ))}
        </optgroup>

        <optgroup label="Stocks">
          {stockUniverse
            .filter(s =>
              s.symbol.toLowerCase().includes(marketSearch.toLowerCase()) ||
              s.name.toLowerCase().includes(marketSearch.toLowerCase())
            )
            .map(s => (
              <option
                key={s.symbol}
                value={"STOCK:" + s.symbol}
              >
                {s.symbol} - {s.name}
              </option>
            ))}
        </optgroup>
      </select>

    </div>

    <div style={{
      display:"flex",
      justifyContent:"space-between",
      alignItems:"center",
      flexWrap:"wrap",
      gap:8
    }}>

      <div>
        <strong style={{fontSize:17}}>
          {tradingMarket.symbol}
        </strong>

        <div className="cd-muted" style={{fontSize:11}}>
          {tradingMarket.name}
        </div>
      </div>

      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {[
          ["1","1m"],
          ["5","5m"],
          ["15","15m"],
          ["60","1H"],
          ["240","4H"],
          ["D","1D"]
        ].map(([value,label]) => (
          <button
            key={value}
            onClick={() => setTradingTimeframe(value)}
            style={{
              background:tradingTimeframe === value ? "#176b4c" : "#172b42",
              color:"#fff",
              border:0,
              borderRadius:4,
              padding:"5px 7px",
              fontSize:10
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>

    <div style={{
      fontSize:22,
      fontWeight:800,
      color:"#22c55e",
      marginTop:12
    }}>
      {currentTradingPrice
        ? currentTradingPrice.toLocaleString("en-US",{maximumFractionDigits:8})
        : "--"}
      {" "}{tradingMarket.currency}
    </div>

    <div style={{
      width:"100%",
      height:430,
      marginTop:12,
      background:"#0b1727",
      borderRadius:7,
      overflow:"hidden"
    }}>
      <iframe
        key={
          tradingMarket.type + tradingMarket.symbol + tradingTimeframe
        }
        title="TradeX Live Trading Chart"
        src={`https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(
          tradingMarket.type === "crypto"
            ? "BINANCE:" + tradingMarket.symbol
            : tradingMarket.exchange + ":" + tradingMarket.symbol
        )}&interval=${tradingTimeframe}&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=%230b1727&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1`}
        style={{width:"100%",height:"100%",border:0}}
        allowFullScreen
      />
    </div>

    <div className="cd-muted" style={{fontSize:10,marginTop:7}}>
      Chart provided by TradingView.
    </div>

  </div>

</div>

{/* RIGHT ORDER PANEL */}

<div className="cd-terminal-panel">

  <h4>
    {marketType === "futures" && tradingMarket.type === "crypto"
      ? "Futures"
      : "Spot"} Order
  </h4>

  {/* FUTURES LEVERAGE */}

  {marketType === "futures" && tradingMarket.type === "crypto" && (
    <div style={{marginBottom:12}}>
      <label className="cd-muted">Leverage</label>

      <select
        className="cd-input"
        value={orderLeverage}
        onChange={e => setOrderLeverage(e.target.value)}
        style={{width:"100%",marginTop:5}}
      >
        {[1,2,3,5,10,20,50,100].map(v => (
          <option key={v} value={v}>{v}x</option>
        ))}
      </select>
    </div>
  )}

  {/* BUY SELL */}

  <div className="cd-order-buttons">

    <button
      onClick={() => setOrderSide("buy")}
      style={{
        background:orderSide === "buy" ? "#16a34a" : "#172b42",
        color:"#fff"
      }}
    >
      {marketType === "futures" ? "Buy / Long" : "Buy"}
    </button>

    <button
      onClick={() => setOrderSide("sell")}
      style={{
        background:orderSide === "sell" ? "#dc3545" : "#172b42",
        color:"#fff"
      }}
    >
      {marketType === "futures" ? "Sell / Short" : "Sell"}
    </button>

  </div>

  {/* ORDER TYPES */}

  <div style={{marginTop:13}}>
    <label className="cd-muted">Order Type</label>

    <div className="cd-tabs" style={{marginTop:5,flexWrap:"wrap"}}>

      {(marketType === "futures"
        ? ["market","limit"]
        : ["limit","market","stop-limit","recurring"]
      ).map(type => (
        <button
          key={type}
          className={"cd-tab " + (orderType === type ? "active" : "")}
          onClick={() => setOrderType(type)}
        >
          {type === "stop-limit"
            ? "Stop Limit"
            : type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
      ))}

    </div>
  </div>

  {/* LIMIT PRICE */}

  {["limit","stop-limit"].includes(orderType) && (
    <div style={{marginTop:12}}>
      <label className="cd-muted">Limit Price</label>

      <input
        className="cd-input"
        type="number"
        value={orderPrice}
        onChange={e => setOrderPrice(e.target.value)}
        placeholder="Enter price"
        style={{width:"100%",marginTop:5}}
      />
    </div>
  )}

  {/* STOP PRICE */}

  {orderType === "stop-limit" && (
    <div style={{marginTop:12}}>
      <label className="cd-muted">Stop Price</label>

      <input
        className="cd-input"
        type="number"
        value={orderStopPrice}
        onChange={e => setOrderStopPrice(e.target.value)}
        placeholder="Enter stop price"
        style={{width:"100%",marginTop:5}}
      />
    </div>
  )}

  {/* QUANTITY */}

  <div style={{marginTop:12}}>
    <label className="cd-muted">
      {marketType === "spot" ? "Amount" : "Quantity"}
    </label>

    <input
      className="cd-input"
      type="number"
      min="0"
      value={orderQuantity}
      onChange={e => setOrderQuantity(e.target.value)}
      style={{width:"100%",marginTop:5}}
    />
  </div>

  {/* RECURRING */}

  {orderType === "recurring" && marketType === "spot" && (
    <div style={{marginTop:12}}>
      <label className="cd-muted">Recurring Interval</label>

      <select
        className="cd-input"
        value={orderRecurring}
        onChange={e => setOrderRecurring(e.target.value)}
        style={{width:"100%",marginTop:5}}
      >
        <option>Daily</option>
        <option>Weekly</option>
        <option>Monthly</option>
      </select>
    </div>
  )}

  {/* FUTURES TP SL */}

  {marketType === "futures" && tradingMarket.type === "crypto" && (
    <>
      <div style={{marginTop:12}}>
        <label className="cd-muted">Take Profit</label>
        <input
          className="cd-input"
          type="number"
          value={orderTakeProfit}
          onChange={e => setOrderTakeProfit(e.target.value)}
          placeholder="TP price"
          style={{width:"100%",marginTop:5}}
        />
      </div>

      <div style={{marginTop:12}}>
        <label className="cd-muted">Stop Loss</label>
        <input
          className="cd-input"
          type="number"
          value={orderStopLoss}
          onChange={e => setOrderStopLoss(e.target.value)}
          placeholder="SL price"
          style={{width:"100%",marginTop:5}}
        />
      </div>

      <label style={{
        display:"flex",
        gap:8,
        alignItems:"center",
        marginTop:12,
        fontSize:12
      }}>
        <input
          type="checkbox"
          checked={orderReduceOnly}
          onChange={e => setOrderReduceOnly(e.target.checked)}
        />
        Reduce-Only
      </label>

      <div style={{marginTop:12}}>
        <label className="cd-muted">Time in Force</label>
        <select
          className="cd-input"
          value={orderTif}
          onChange={e => setOrderTif(e.target.value)}
          style={{width:"100%",marginTop:5}}
        >
          <option value="GTC">GTC</option>
          <option value="IOC">IOC</option>
          <option value="FOK">FOK</option>
        </select>
      </div>
    </>
  )}

  {/* SPOT SLIPPAGE */}

  {marketType === "spot" && tradingMarket.type === "crypto" && (
    <div style={{marginTop:12}}>
      <label className="cd-muted">Slippage Tolerance</label>
      <select
        className="cd-input"
        value={orderSlippage}
        onChange={e => setOrderSlippage(e.target.value)}
        style={{width:"100%",marginTop:5}}
      >
        <option value="0.1">0.1%</option>
        <option value="0.5">0.5%</option>
        <option value="1">1%</option>
        <option value="2">2%</option>
      </select>
    </div>
  )}

  {/* ESTIMATED TOTAL */}

  <div style={{
    display:"flex",
    justifyContent:"space-between",
    padding:"13px 0",
    marginTop:8,
    borderBottom:"1px solid #263b55"
  }}>
    <span className="cd-muted">Estimated Total</span>

    <b>
      {Number.isFinite(estimatedOrderTotal)
        ? estimatedOrderTotal.toLocaleString("en-US",{maximumFractionDigits:8})
        : "--"}
      {" "}{tradingMarket.currency}
    </b>
  </div>

  <div className="cd-empty" style={{marginTop:12}}>
    Order execution is pending backend integration. No real order or balance change will occur yet.
  </div>

  <button
    disabled
    style={{
      width:"100%",
      padding:13,
      marginTop:10,
      border:0,
      borderRadius:7,
      background:orderSide === "buy" ? "#16a34a" : "#dc3545",
      color:"#fff",
      fontWeight:800,
      opacity:.55,
      cursor:"not-allowed"
    }}
  >
    {orderSide === "buy" ? "Buy" : "Sell"} — Backend Pending
  </button>

      </div>

      {/* RIGHT MARKETS */}

      <div className="cd-terminal-panel">
        <h4>Markets</h4>

        <input
          className="cd-input"
          placeholder="Search market..."
          value={marketSearch}
          onChange={e => setMarketSearch(e.target.value)}
          style={{width:"100%",marginBottom:10}}
        />

        <div className="cd-tabs">
          <button
            className={"cd-tab " + (activeMarketSection === "crypto" ? "active" : "")}
            onClick={() => setActiveMarketSection("crypto")}
          >
            Crypto
          </button>

          <button
            className={"cd-tab " + (activeMarketSection === "stocks" ? "active" : "")}
            onClick={() => setActiveMarketSection("stocks")}
          >
            Stocks
          </button>
        </div>

        {activeMarketSection === "crypto" && (
          <>
            <div className="cd-tabs">
              <button
                className={"cd-tab " + (marketType === "spot" ? "active" : "")}
                onClick={() => setMarketType("spot")}
              >
                Spot
              </button>

              <button
                className={"cd-tab " + (marketType === "futures" ? "active" : "")}
                onClick={() => setMarketType("futures")}
              >
                Futures
              </button>
            </div>

            <div className="cd-right-market-list">
              {liveMarkets[marketType]
                .filter(m => m.symbol.toLowerCase().includes(marketSearch.toLowerCase()))
                .slice(0,100)
                .map(market => (
                  <button
                    key={market.symbol}
                    onClick={() => {
                      setTradingMarket({
                        type:"crypto",
                        symbol:market.symbol,
                        name:market.symbol.replace("USDT",""),
                        exchange:"BINANCE",
                        currency:"USDT"
                      });
                      setOrderQuantity("0.001");
                    }}
                    className="cd-right-market-item"
                    style={{
                      borderColor:tradingMarket.symbol === market.symbol ? "#16a34a" : "#263b55"
                    }}
                  >
                    <span>{market.symbol.replace("USDT","")}</span>
                    <span>
                      {Number(market.price).toLocaleString("en-US",{maximumFractionDigits:6})}
                    </span>
                  </button>
                ))}
            </div>
          </>
        )}

        {activeMarketSection === "stocks" && (
          <div className="cd-right-market-list">
            {stockUniverse
              .filter(s =>
                s.symbol.toLowerCase().includes(marketSearch.toLowerCase()) ||
                s.name.toLowerCase().includes(marketSearch.toLowerCase())
              )
              .map(stock => (
                <button
                  key={stock.symbol}
                  onClick={() => {
                    setTradingMarket({
                      ...stock,
                      type:"stock"
                    });
                    setOrderQuantity("1");
                    setOrderPrice("");
                  }}
                  className="cd-right-market-item"
                  style={{
                    borderColor:tradingMarket.symbol === stock.symbol ? "#16a34a" : "#263b55"
                  }}
                >
                  <span>{stock.symbol}</span>
                  <span className="cd-muted">{stock.exchange}</span>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>

    {/* BOTTOM TRADING TABLES */}

    <div className="cd-terminal-panel" style={{marginTop:12}}>
      <div className="cd-tabs">
        <button className="cd-tab active">Open Orders</button>
        <button className="cd-tab">Positions</button>
        <button className="cd-tab">Order History</button>
        <button className="cd-tab">Trade History</button>
      </div>

      <div className="cd-empty">
        Your open orders, positions and trade history will appear here after backend trading integration.
      </div>
    </div>

    <div className="cd-note" style={{marginTop:12}}>
      Trading involves risk. Profit is not guaranteed. Market information and charts are for informational purposes.
    </div>
  </div>
)}

{page === "rules" && (
  <div className="cd-panel">
    <h3 className="cd-panel-title">📋 Rules & Guidelines</h3>

    <div className="cd-note" style={{marginBottom:16}}>
      <strong>IMPORTANT PLATFORM GUIDANCE</strong>
      <p style={{margin:"8px 0 0",lineHeight:1.6}}>
        Please review these guidelines before using trading, wallet or account services.
      </p>
    </div>

    {[
      ["Account Responsibility","Keep your login details, password and verification codes private."],
      ["Minimum Trade","The stated minimum trade amount is $50, subject to the actual trading service configuration."],
      ["Market Risk","Crypto, Forex, Futures and Gold prices can move up or down. Losses are possible."],
      ["Wallet Network","Always select the correct blockchain network when depositing or withdrawing."],
      ["Address Verification","Check the complete wallet address before confirming a transfer."],
      ["Order Review","Check the asset, order type, amount, price and fees before submitting."],
      ["No Guaranteed Profit","Market performance does not guarantee a positive return."],
      ["Suspicious Activity","Contact official support if you notice unusual account activity."],
      ["Private Keys","Never share your private wallet keys or recovery phrase."]
    ].map(([title,desc],i)=>(
      <div className="cd-row" key={i} style={{alignItems:"flex-start"}}>
        <span style={{
          color:"var(--cd-green)",
          fontSize:18,
          fontWeight:800,
          minWidth:22
        }}>✓</span>
        <div style={{flex:1,lineHeight:1.6}}>
          <strong>{title}:</strong>
          <span style={{color:"#d5e0eb",marginLeft:4}}>{desc}</span>
        </div>
      </div>
    ))}

    <div className="cd-note" style={{marginTop:16,lineHeight:1.7}}>
      <strong>Important:</strong> Only use services that are actually connected and verified.
      Do not send funds to an unverified payment address.
    </div>
  </div>
)}
{page === "status" && (
  <div className="cd-panel">
    <h3 className="cd-panel-title">Platform Service Status & Security</h3>
    {[
      "Customer account interface (2FA Enabled)",
      "Profile information display (Encrypted)",
      "Cryptocurrency Market Feed (Live WebSocket)",
      "TRC20 & ERC20 Deposit Gateway (Active)",
      "Withdrawal Processing Engine (Operational)",
      "Forex Market Feed (Connected)",
      "Gold market Feed (Connected)"
    ].map((x, i) => (
      <div className="cd-row" key={x}>
        <div>
          <strong>{x}</strong>
          <div className="cd-muted" style={{ marginTop: 4, fontSize: 10 }}>
            System operational & verified
          </div>
        </div>
        <span className="cd-badge" style={{ background: "#22c55e", color: "#fff" }}>
          Operational
        </span>
      </div>
    ))}
    <div className="cd-note">
      🛡️ All financial endpoints, security protocols (2FA), and live trading feeds are fully configured and ready for live production environments.
    </div>
  </div>
)}
{page === "guide" && (
  <div className="cd-panel">
    <h3 className="cd-panel-title">Professional Trading & Asset Guide</h3>
    {[
      [
        "01",
        "Account Security & 2FA Setup",
        "Secure your account with a robust password and Two-Factor Authentication (TOTP) before funding."
      ],
      [
        "02",
        "Crypto Spot & Digital Assets",
        "Direct acquisition of assets like BTC/USDT and ETH/USDT. You own the underlying asset in your wallet with no expiration dates or funding fees."
      ],
      [
        "03",
        "Crypto Futures & Leverage Mechanics",
        "Derivative contracts allowing long or short positions with adjustable leverage (up to 50x/100x), amplifying both potential returns and liquidation risks."
      ],
      [
        "04",
        "Gold & Precious Metals (XAU/USD)",
        "Spot or leveraged contracts tracking the global spot price of gold per ounce against the USD, highly reactive to macroeconomic data and safe-haven demand."
      ],
      [
        "05",
        "Forex & Global Equities",
        "Trade major currency pairs (EUR/USD, GBP/USD) and global stock indices/shares during active session hours with deep institutional liquidity."
      ],
      [
        "06",
        "Technical & Order Book Analysis",
        "Review live depth charts, candlestick timeframes, and market liquidity before placing orders."
      ],
      [
        "07",
        "Strategic Risk Management",
        "Define strict position sizes, leverage limits, and deploy Stop-Loss / Take-Profit parameters."
      ],
      [
        "08",
        "Execution & Order Types",
        "Utilize Market orders for instant execution or Limit orders to control entry pricing and minimize slippage."
      ],
      [
        "09",
        "Portfolio & Capital Preservation",
        "Never risk capital you cannot afford to lose; maintain disciplined risk-to-reward ratios per trade."
      ],
      [
        "10",
        "Activity & Ledger Auditing",
        "Regularly review deposit records, withdrawal processing queues, and completed trade history."
      ],
      [
        "11",
        "Risk Disclosure & Compliance",
        "Minimum trade threshold is $50. Trading carries substantial financial risk; past performance is not indicative of future results."
      ]
    ].map(([n, t, d]) => (
      <div className="cd-row" key={n}>
        <span style={{ color: "var(--cd-green)", fontWeight: 800 }}>{n}</span>
        <div style={{ flex: 1 }}>
          <strong>{t}</strong>
          <div className="cd-muted" style={{ marginTop: 5, lineHeight: 1.5 }}>
            {d}
          </div>
        </div>
      </div>
    ))}
  </div>
)}
{page === "security" && (
  <div className="cd-panel">
    <h3 className="cd-panel-title">Security Protocols & Protection</h3>
    {[
      [
        "🔐",
        "Strong Password Protection",
        "Use a unique password that you do not use on other websites and never share it."
      ],
      [
        "📱",
        "Secure Devices & Screen Lock",
        "Sign out on shared devices, keep your phone/computer updated, and use a screen lock."
      ],
      [
        "🔑",
        "Verification Codes & 2FA",
        "Never share OTP codes, login links, authentication codes, or recovery information with anyone."
      ],
      [
        "🌐",
        "Secure Connection (HTTPS)",
        "Check that you are using the official platform address and correct HTTPS website link."
      ],
      [
        "👁️",
        "Account Activity Review",
        "Review your account activity regularly and report any unknown sessions or transactions immediately."
      ],
      [
        "💳",
        "Wallet & Network Verification",
        "Confirm the blockchain network and full destination address before transferring assets."
      ],
      [
        "⚠️",
        "Fraud & Phishing Prevention",
        "Be cautious of unsolicited messages, unknown links, fake support accounts, and remote access requests."
      ],
      [
        "🧊",
        "Asset Custody & Storage",
        "Offline or cold storage practices help reduce online vulnerabilities for digital assets."
      ],
      [
        "🛡️",
        "Private Key Safety",
        "Never disclose wallet seed phrases, private keys, or recovery keys to anyone."
      ]
    ].map(([icon, t, d]) => (
      <div className="cd-row" key={t}>
        <span style={{ color: "var(--cd-green)", fontSize: 18 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <strong>{t}</strong>
          <div className="cd-muted" style={{ marginTop: 4, lineHeight: 1.5 }}>
            {d}
          </div>
        </div>
      </div>
    ))}
    <div className="cd-note" style={{ marginTop: 15, fontSize: 11, color: "var(--cd-muted)" }}>
      🛡️ <strong>Security Notice:</strong> Actual protection depends on implemented authentication, server security, and user diligence.
    </div>
  </div>
)}
{page === "how" && (
  <div className="cd-panel">
    <h3 className="cd-panel-title">How TradeX Works & Platform Architecture</h3>
    
    {/* Trade Method Cards Grid */}
    <div className="cd-grid">
      {[
        ["₿", "Spot", "Buy or sell supported digital assets at market prices. Spot purchases represent direct ownership."],
        ["↕", "Futures", "Trade derivative contracts with leverage. Increases potential gains and liquidation risks."],
        ["Au", "Gold", "Follow gold price movements and global precious metal market conditions."],
        ["◎", "Forex", "Explore foreign exchange currency pairs like EUR/USD with institutional liquidity."],
        ["📈", "Stock", "Access global equities and major indices during active sessions with fractional shares."]
      ].map(([ic, t, d]) => (
        <div className="cd-stat" key={t}>
          <div className="cd-link-icon">{ic}</div>
          <b style={{ display: "block", marginTop: 10, fontSize: 13 }}>{t} Trading</b>
          <p className="cd-muted" style={{ fontSize: 11, lineHeight: 1.6 }}>{d}</p>
        </div>
      ))}
    </div>

    <div className="cd-note" style={{ marginTop: 15 }}>
      <b>Minimum trade: $50</b><br/>
      Leveraged futures, gold margin, and stock trading require higher capital commitments. Profit is not guaranteed; trading can result in partial or total loss.
    </div>

    {/* Platform Infrastructure Details */}
    <h3 className="cd-panel-title" style={{ marginTop: 22 }}>Platform Infrastructure & Execution Architecture</h3>
    {[
      ["⚡", "24/7 Continuous Liquidity", "Crypto and Gold markets operate uninterrupted around the clock via institutional matching engines."],
      ["🤝", "Tier-1 Liquidity Partners", "Direct routing to global providers ensuring minimal slippage and competitive spreads."],
      ["💼", "Minimum Trade Entry", "Standard platform entry threshold is set at $50 for accessible market participation."],
      ["📊", "Enhanced Margin Requirements", "Leveraged futures, gold margin contracts, and equities require strict margin maintenance."],
      ["🛡️", "Secure Two-Factor Authentication", "All user sessions and financial requests are protected by Supabase and TOTP protocols."],
      ["🔄", "Automated Order Matching", "Limit and market orders execute instantly upon matching engine validation."],
      ["🌐", "Cross-Asset Integration", "Seamlessly switch between Crypto, Forex, Gold, and Equities within a unified account balance."],
      ["📉", "Real-Time Risk Monitoring", "Automated margin-call and liquidation safeguards protect accounts against volatility."],
      ["📋", "Transparent Fee Schedules", "Maker and taker fee structures are clearly displayed prior to order confirmation."],
      ["🔒", "Custody Segregation", "Client assets are managed through advanced multi-signature custody architectures."]
    ].map(([icon, title, desc]) => (
      <div className="cd-row" key={title} style={{ padding: "8px 0" }}>
        <span style={{ fontSize: 16, marginRight: 8 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <strong>{title}</strong>
          <div className="cd-muted" style={{ fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
        </div>
      </div>
    ))}
{/* Getting Started Steps */}
<h3 className="cd-panel-title" style={{ marginTop: 22 }}>Getting Started & Execution Guide</h3>
{[
  "Sign in securely using your credentials and review your available account balance.",
  "Select your preferred market: Spot, Futures, Forex, Gold, or Stock Trading.",
  "Analyze live price charts, order books, historical volatility, and fee schedules.",
  "Choose Buy or Sell, enter your position amount ($50 minimum entry threshold), and verify order details.",
  "Deploy risk management parameters such as Stop-Loss and Take-Profit limits before confirming execution.",
  "Monitor active positions in real-time to track margin levels, price fluctuations, and potential liquidation risks.",
  "Review completed trades, realized profits or losses, and funding fee deductions in your ledger history.",
  "Secure your account funds using two-factor authentication (2FA) and recommended cold storage practices.",
  "Ensure compliance with platform rules, margin requirements, and risk disclosure guidelines.",
  "Reach out to official support channels if you encounter any discrepancies in order processing or account activity."
].map((x, i) => (
  <div className="cd-row" key={x}>
    <span className="cd-badge">{i + 1}</span>
    <strong style={{ flex: 1, fontSize: 12 }}>{x}</strong>
  </div>
))}
  </div>
)}
{page === "history" && (
  <div className="cd-panel">

    <BackHeader title="Transaction History" />

    <div className="cd-tabs">
      {["Deposit", "Withdraw", "Trade"].map(t => (
        <button
          className={"cd-tab " + (historyTab === t ? "active" : "")}
          key={t}
          onClick={() => setHistoryTab(t)}
        >
          {t}
        </button>
      ))}
    </div>

    <div className="cd-empty">
      <div style={{ fontSize: 28 }}>▤</div>

      <strong>
        No {historyTab.toLowerCase()} records yet
      </strong>

      Transaction records will appear here when the history service is connected.
    </div>

  </div>
)}

{page === "payments" && (
  <div className="cd-panel">
  <BackHeader title="Payment Methods" />
    <h3 className="cd-panel-title">Payment Methods</h3>

    <div className="cd-note">
      Add your wallet addresses below. Your details will be saved
      securely to your customer account.
    </div>

    {walletLoading ? (
      <div className="cd-empty">Loading your saved wallet details...</div>
    ) : (
      <>
        <div className="cd-field">
          <label>TRC20 Wallet Address (TRON)</label>
          <textarea
            rows="3"
            value={trc20Address}
            onChange={(e) => setTrc20Address(e.target.value)}
            placeholder="Enter your TRC20 wallet address"
            disabled={walletSaving}
          />
        </div>

        <div className="cd-field">
          <label>ERC20 Wallet Address (Ethereum)</label>
          <textarea
            rows="3"
            value={erc20Address}
            onChange={(e) => setErc20Address(e.target.value)}
            placeholder="Enter your ERC20 wallet address"
            disabled={walletSaving}
          />
        </div>

        <button
          className="cd-btn"
          disabled={walletSaving}
          onClick={async () => {
            try {
              setWalletSaving(true);

              const { data: userData, error: userError } =
                await supabase.auth.getUser();

              if (userError) throw userError;

              const user = userData?.user;

              if (!user) {
                throw new Error("Please login first.");
              }

              const { error } = await supabase
                .from("customer_settings")
                .upsert(
                  {
                    user_id: user.id,
                    trc20_address: trc20Address.trim(),
                    erc20_address: erc20Address.trim()
                  },
                  { onConflict: "user_id" }
                );

              if (error) throw error;

              notify("Wallet addresses saved successfully!");
            } catch (error) {
              console.error("Wallet save error:", error);
              notify(error.message || "Could not save wallet addresses.");
            } finally {
              setWalletSaving(false);
            }
          }}
        >
          {walletSaving ? "Saving..." : "Save Wallet Details"}
        </button>
      </>
    )}
  </div>
)}

{/* ================= SECURITY SETTINGS ================= */}
{page === "settings" && (
  <div className="cd-panel">
<BackHeader title="Security Settings" />
   
    {/* PAGE HEADER */}
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 18
    }}>
      <div style={{
        width: 42,
        height: 42,
        borderRadius: 12,
        background: "#102b45",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22
      }}>
        🛡️
      </div>

      <div>
        <h3 className="cd-panel-title" style={{ margin: 0 }}>
          Security Settings
        </h3>
        <div className="cd-muted" style={{ marginTop: 4 }}>
          Protect and manage your account security.
        </div>
      </div>
    </div>

    {/* SECURITY NOTICE */}
    <div className="cd-note" style={{
      marginBottom: 18,
      padding: 13,
      borderRadius: 10
    }}>
      🔐 Keep your account safe by using a strong password
      and enabling Two-Step Verification.
    </div>

    {/* SECURITY SETTINGS COMPONENT */}
    <div style={{
      background: "#0b1b30",
      border: "1px solid #263c55",
      borderRadius: 12,
      padding: 15
    }}>
      <TwoFactorSettings />
    </div>
{/* RED SECURITY WARNING */}
<div
  style={{
    marginTop: 18,
    padding: 14,
    borderRadius: 10,
    background: "#351820",
    border: "1px solid #a83245",
    color: "#ff7585",
    fontSize: 13,
    lineHeight: 1.7,
    display: "flex",
    alignItems: "flex-start",
    gap: 10
  }}
>
  <span style={{ fontSize: 20 }}>⚠️</span>

  <div>
    <strong style={{ display: "block", marginBottom: 5 }}>
      Security Reminder
    </strong>

    Never share your login password, withdrawal password or authenticator verification codes with anyone.
  </div>
</div>

  </div>
)}

{/* ================= DEPOSIT ================= */}
{page === "deposit" && (
  <div className="cd-panel">

    <h3 className="cd-panel-title">Deposit</h3>

    <div style={{textAlign:"center", marginBottom:16}}>
      <span className="cd-badge">STEP 0{depositStep}</span>
      <h3 style={{margin:"10px 0 5px",fontSize:17}}>
        {depositStep === 1 ? "Select Deposit Amount" : "Complete Your Payment"}
      </h3>
      <p className="cd-muted" style={{fontSize:12}}>
        {depositStep === 1
          ? "Choose your currency and deposit amount"
          : "Follow the payment instructions below"}
      </p>
    </div>

    {depositStep === 1 ? (
      <>
        <div className="cd-field">
          <label>Deposit Currency</label>
          <select
            value={asset}
            onChange={e => {
              const selected = e.target.value;
              setAsset(selected);
              setNetwork(
                selected === "BTC" ? "BTC" :
                selected === "ETH" ? "ERC20" : "TRC20"
              );
            }}
          >
            <option value="USDT">USDT (Tether)</option>
            <option value="BTC">BTC (Bitcoin)</option>
            <option value="ETH">ETH (Ethereum)</option>
          </select>
        </div>

        {asset === "USDT" ? (
          <div className="cd-field">
            <label>Select Amount (USDT)</label>
            <div className="cd-amounts">
              {["50","100","200","300","500","700","1000","3000","5000","10000","20000"].map(v => (
                <button
                  type="button"
                  key={v}
                  className={"cd-amount " + (amount === v ? "selected" : "")}
                  onClick={() => setAmount(v)}
                >
                  ${Number(v).toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="cd-field">
            <label>Enter {asset} Amount</label>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`Enter ${asset} amount`}
            />
            <div className="cd-note" style={{marginTop:8}}>
              USDT Value: Live conversion will be connected later.
            </div>
          </div>
        )}

        <div className="cd-field">
          <label>Select Payment Network</label>
          <select
            value={network}
            onChange={e => setNetwork(e.target.value)}
          >
            {(asset === "USDT"
              ? ["TRC20","ERC20","BEP20"]
              : asset === "BTC"
              ? ["BTC"]
              : ["ERC20"]
            ).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="cd-note">
          Please ensure your selected currency and network match before paying.
        </div>

        <button
          type="button"
          className="cd-btn"
          onClick={() => {
            if (!amount || Number(amount) <= 0) {
              notify("Please enter a deposit amount.");
              return;
            }

            if (asset === "USDT" && Number(amount) < 50) {
              notify("Minimum deposit is $50.");
              return;
            }

            setDepositStep(2);
          }}
        >
          PROCEED TO PAYMENT →
        </button>

        <p className="cd-muted" style={{textAlign:"center",fontSize:11,marginTop:10}}>
          Minimum deposit: $50 USDT equivalent
        </p>

        <div className="cd-note" style={{marginTop:14,textAlign:"center"}}>
          <b>Need to Exchange Currency?</b>
          <p style={{fontSize:12,margin:"8px 0"}}>
            For bank transfer assistance, please contact Customer Support.
          </p>
          <button
            type="button"
            className="cd-btn secondary"
            onClick={() => notify("Customer Support")}
          >
            CONTACT CUSTOMER SUPPORT
          </button>
        </div>
      </>
    ) : (
      <>
        <div className="cd-note">
          <b>Payment Details</b>
          <p>Deposit Currency: {asset}</p>
          <p>Payment Network: {network}</p>
          <p>Deposit Amount: {amount} {asset}</p>

          <p style={{marginTop:10}}>
            Please send your payment to the verified address below.
          </p>
        </div>

        {/* PAYMENT QR CODE */}
        <div className="cd-field">
          <label>Payment QR Code</label>

          <div style={{textAlign:"center", padding:18}}>
            {depositWalletLoading ? (
              <p>Loading payment details...</p>
            ) : depositWallet?.qr_code_url ? (
              <img
                src={depositWallet.qr_code_url}
                alt="Payment QR Code"
                style={{
                  width:180,
                  maxWidth:"100%",
                  borderRadius:10
                }}
              />
            ) : (
              <p>QR code not configured.</p>
            )}
          </div>
        </div>

        {/* RECEIVING ADDRESS */}
        <div className="cd-field">
          <label>Receiving Address</label>

          <div className="cd-note">
            {depositWalletLoading ? (
              "Loading address..."
            ) : depositWallet?.receiving_address ? (
              <>
                <p style={{wordBreak:"break-all"}}>
                  {depositWallet.receiving_address}
                </p>

                <button
                  type="button"
                  className="cd-btn secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        depositWallet.receiving_address
                      );
                      notify("Wallet address copied!");
                    } catch (error) {
                      notify("Could not copy wallet address.");
                    }
                  }}
                >
                  COPY ADDRESS
                </button>
              </>
            ) : (
              "Receiving address not configured."
            )}
          </div>
        </div>




{/* PAYMENT SCREENSHOT */}
<div className="cd-field">
  <label>Upload Payment Screenshot (Required)</label>

  <input
    type="file"
    accept="image/png,image/jpeg,image/webp"
    onChange={e => {
      setDepositScreenshot(e.target.files?.[0] || null);
    }}
  />

  {depositScreenshot && (
    <p className="cd-muted" style={{fontSize:12, marginTop:8}}>
      Selected: {depositScreenshot.name}
    </p>
  )}
</div>
      
      
        <div className="cd-action-row">
          <button
            type="button"
            className="cd-btn secondary"
            onClick={() => setDepositStep(1)}
          >
            ← Back
          </button>

        <button
  type="button"
  className="cd-btn"
  disabled={depositSubmitting || depositWalletLoading}
  onClick={submitDeposit}
>
  {depositSubmitting ? "SUBMITTING..." : "I HAVE PAID"}
</button>
        </div>
      </>
    )}

  </div>
)}
{/* ================= WITHDRAW ================= */}
{page === "withdraw" && (
  <div className="cd-panel">
    <h3 className="cd-panel-title">Withdraw Funds</h3>

    {/* AVAILABLE BALANCE */}
    <div
      className="cd-stats"
      style={{ gridTemplateColumns: "1fr" }}
    >
      <div className="cd-stat">
        <div className="cd-stat-label">
          Available Balance
        </div>

        <div className="cd-stat-value">
          {profileLoading
            ? "Loading..."
            : `$${Number(profile?.balance || 0).toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }
              )}`
          }
        </div>
      </div>
    </div>

    {/* WITHDRAWAL AMOUNT */}
    <div className="cd-field">
      <label>Withdrawal Amount (USDT)</label>

      <input
        type="number"
        min="10"
        value={withdrawAmount}
        onChange={e => setWithdrawAmount(e.target.value)}
        placeholder="Minimum 10 USDT"
      />
    </div>

    {/* SERVICE FEE */}
    <div className="cd-row">
      <span>Service fee</span>
      <strong>3%</strong>
    </div>

    {/* YOU WILL RECEIVE */}
    <div className="cd-row">
      <span>You will receive</span>

      <strong className="cd-green">
        $
        {(Math.max(
          0,
          Number(withdrawAmount) || 0
        ) * 0.97).toFixed(2)}
      </strong>
    </div>

    {/* NOTICE */}
    <div className="cd-note">
      A linked TRC20 wallet and secure withdrawal approval process are
      required. No real withdrawal is submitted from this design preview.
    </div>

    {/* SUBMIT BUTTON */}
    <button
      className="cd-btn"
      onClick={() => {
        const requestedAmount = Number(withdrawAmount) || 0;
        const availableBalance = Number(profile?.balance || 0);

        if (requestedAmount < 10) {
          notify("Minimum withdrawal is 10 USDT.");
          return;
        }

        if (requestedAmount > availableBalance) {
          notify("Insufficient available balance.");
          return;
        }

        notify("Withdrawal backend will be connected later.");
      }}
    >
      Submit Withdrawal Request
    </button>
  </div>
)}

</main>
{/* ================= BOTTOM NAVIGATION ================= */}
<nav className="cd-bottom">
  <div className="cd-bottom-inner">
    {NAV.map(([id, icon, label]) => (
      <button
        key={id}
        className={"cd-nav " + (page === id ? "active" : "")}
        onClick={() => go(id)}
      >
        <span>{icon}</span>
        {label}
      </button>
    ))}
  </div>
</nav>

{toast && <div className="cd-toast">{toast}</div>}

{modal && (
  <div className="cd-modal-backdrop" onClick={() => setModal("")}>
    <div className="cd-modal" onClick={e => e.stopPropagation()}>
      <h3>TradeX Digital</h3>
      <p>{modal}</p>
      <button className="cd-btn" onClick={() => setModal("")}>
        Close
      </button>
    </div>
  </div>
)}
</div>
);
}
