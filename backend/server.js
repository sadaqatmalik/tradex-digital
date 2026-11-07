const cookieParser = require("cookie-parser");
require("dotenv").config();
const {
  hashPassword,
  verifyPassword
} = require("./adminAuth");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const WebSocket = require("ws");

const rateLimit = require("express-rate-limit");
const { createClient } = require("@supabase/supabase-js");
const multer = require("multer");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();

const qrUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PNG, JPG and WEBP images are allowed."));
    }

    cb(null, true);
  }
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_APP_PASSWORD
  }
});

async function sendAdminOTP(email, code, purpose) {
  await mailer.sendMail({
    from: `"TradeX Digital Security" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "TradeX Digital — Security Verification Code",
    text:
      `Your verification code is ${code}.\n\n` +
      `Purpose: ${purpose}\n` +
      `This code expires in 5 minutes. Do not share it with anyone.`
  });
}

const PORT = process.env.PORT || 3000;
// ==========================================
// ADMIN PERSISTENT SESSION HELPERS
// HTTPONLY COOKIE + DATABASE SESSION
// ==========================================

function hashAdminSessionToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}
function getAdminBearerToken(req) {
  return req.cookies?.admin_session || "";
}

const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000
};
async function getAdminFromSessionToken(token) {
  if (!token) return null;

  const tokenHash = hashAdminSessionToken(token);

  const { data: session, error: sessionError } = await supabase
    .from("admin_sessions")
    .select("id, admin_id, expires_at")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (sessionError) throw sessionError;
  if (!session) return null;

  const { data: admin, error: adminError } = await supabase
    .from("admin_accounts")
    .select("id, email, role, is_active, session_version")
    .eq("id", session.admin_id)
    .maybeSingle();

  if (adminError) throw adminError;

 if (
  !admin ||
  admin.is_active !== true ||
  !["main_admin", "sub_admin"].includes(admin.role)
) {
  return null;
}
  return { admin, session };
}
// ==========================================
// SECURITY
// ==========================================

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: "draft-8",
  legacyHeaders: false
}));
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

const adminOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification requests. Please try again later."
  }
});

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Globelx Backend is Running",
    status: "online"
  });
});

// ==========================================
// SUPABASE TEST
// ==========================================

app.get("/api/supabase-test", async (req, res) => {
  try {
    const { error } = await supabase
      .from("payment_wallet_settings")
      .select("id")
      .limit(1);

    if (error) throw error;

    res.json({
      success: true,
      message: "Globelx Supabase Connected Successfully"
    });
  } catch (error) {
    console.error("Supabase connection error:", error.message);

    res.status(500).json({
      success: false,
      message: "Supabase connection failed"
    });
  }
});
// ==========================================
// MAIN ADMIN LOGIN
// HTTPONLY COOKIE + DATABASE SESSION
// ==========================================

app.post("/api/admin/login", adminLoginLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = req.body.password;

    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "Email aur password required hain."
      });
    }

    const { data: admin, error } = await supabase
      .from("admin_accounts")
      .select("id, email, password_hash, role, is_active, session_version")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;

    if (
      !admin ||
      admin.is_active !== true ||
      !["main_admin", "sub_admin"].includes(admin.role) ||
      !(await verifyPassword(password, admin.password_hash))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const sessionToken = crypto.randomBytes(48).toString("base64url");
    const tokenHash = hashAdminSessionToken(sessionToken);

    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error: sessionError } = await supabase
      .from("admin_sessions")
      .insert({
        admin_id: admin.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        last_used_at: new Date().toISOString()
      });

    if (sessionError) throw sessionError;

    await supabase
      .from("admin_accounts")
      .update({
        last_login: new Date().toISOString()
      })
      .eq("id", admin.id);

    res.cookie(
      "admin_session",
      sessionToken,
      adminCookieOptions
    );

    return res.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error("Admin login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Admin login failed."
    });
  }
});// ==========================================
// VERIFY ADMIN SESSION USING COOKIE
// ==========================================

app.get("/api/admin/me", async (req, res) => {
  try {
    const token = getAdminBearerToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin login required."
      });
    }

    const result = await getAdminFromSessionToken(token);

    if (!result) {
      res.clearCookie("admin_session", adminCookieOptions);

      return res.status(401).json({
        success: false,
        message: "Admin session invalid. Please login again."
      });
    }

    return res.json({
      success: true,
      admin: result.admin
    });

  } catch (error) {
    console.error("Admin verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not verify admin session."
    });
  }
});
// ==========================================
// ADMIN LOGOUT
// DELETE DATABASE SESSION + COOKIE
// ==========================================

app.post("/api/admin/logout", async (req, res) => {
  try {
    const token = getAdminBearerToken(req);

    if (token) {
      const tokenHash = hashAdminSessionToken(token);

      const { error } = await supabase
        .from("admin_sessions")
        .delete()
        .eq("token_hash", tokenHash);

      if (error) throw error;
    }

    res.clearCookie("admin_session", adminCookieOptions);

    return res.json({
      success: true,
      message: "Admin logged out successfully."
    });

  } catch (error) {
    console.error("Admin logout error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Admin logout failed."
    });
  }
});
// ==========================================
// MAIN ADMIN AUTH MIDDLEWARE
// DATABASE SESSION VALIDATION
// ==========================================

async function requireMainAdmin(req, res, next) {
  try {
    const token = getAdminBearerToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin login required."
      });
    }
const result = await getAdminFromSessionToken(token);

if (!result) {
  return res.status(401).json({
    success: false,
    message: "Admin session invalid. Please log in again."
  });
}

// Only Main Admin can access Main Admin protected routes
if (result.admin.role !== "main_admin") {
  return res.status(403).json({
    success: false,
    message: "Main Admin access required."
  });
}
req.admin = result.admin;
req.adminSession = result.session;

return next();
  } catch (error) {
    console.error("Admin authorization error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Admin authorization failed."
    });
  }
}
// ==========================================
// MAIN ADMIN + SUB ADMIN AUTH MIDDLEWARE
// ==========================================

async function requireAnyAdmin(req, res, next) {
  try {
    const token = getAdminBearerToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin login required."
      });
    }

    const result = await getAdminFromSessionToken(token);

    if (!result) {
      return res.status(401).json({
        success: false,
        message: "Admin session invalid. Please log in again."
      });
    }

    if (!["main_admin", "sub_admin"].includes(result.admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required."
      });
    }

    req.admin = result.admin;
    req.adminSession = result.session;

    return next();

  } catch (error) {
    console.error("Admin authorization error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Admin authorization failed."
    });
  }
}

// ==========================================
// MAIN ADMIN — INVITATION CODE
// ==========================================

// GET MAIN ADMIN INVITATION CODE
app.get(
  "/api/admin/invitation-code",
  requireMainAdmin,
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("admin_accounts")
        .select("invite_code")
        .eq("id", req.admin.id)
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        invite_code: data?.invite_code || ""
      });

    } catch (error) {
      console.error("Load main admin invite code error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not load invitation code."
      });
    }
  }
);


// UPDATE MAIN ADMIN INVITATION CODE
app.put(
  "/api/admin/invitation-code",
  requireMainAdmin,
  async (req, res) => {
    try {
      const inviteCode = String(
        req.body.invite_code || ""
      )
        .trim()
        .toUpperCase();

      if (inviteCode.length < 4 || inviteCode.length > 30) {
        return res.status(400).json({
          success: false,
          message:
            "Invitation code must be between 4 and 30 characters."
        });
      }

      if (!/^[A-Z0-9_-]+$/.test(inviteCode)) {
        return res.status(400).json({
          success: false,
          message:
            "Use only letters, numbers, underscore (_) or hyphen (-)."
        });
      }

      // Make sure another admin is not already using this code
      const { data: existing, error: checkError } = await supabase
        .from("admin_accounts")
        .select("id")
        .eq("invite_code", inviteCode)
        .neq("id", req.admin.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            "This invitation code is already being used."
        });
      }

      const { data, error } = await supabase
        .from("admin_accounts")
        .update({
          invite_code: inviteCode,
          updated_at: new Date().toISOString()
        })
        .eq("id", req.admin.id)
        .select("id, email, invite_code")
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        message: "Invitation code updated successfully.",
        invite_code: data.invite_code
      });

    } catch (error) {
      console.error(
        "Update main admin invite code error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Could not update invitation code."
      });
    }
  }
);

// ==========================================
// MAIN ADMIN — SUB-ADMIN MANAGEMENT
// ==========================================

// GET ALL SUB-ADMINS

app.get("/api/admin/subadmins", requireMainAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("admin_accounts")
      .select("id, email, role, is_active, invite_code, created_at, last_login")
      .eq("role", "sub_admin")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      subAdmins: data || []
    });

  } catch (error) {
    console.error("Load sub-admins error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not load Sub-Admins."
    });
  }
});


// CREATE NEW SUB-ADMIN

app.post("/api/admin/subadmins", requireMainAdmin, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = req.body.password;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address."
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters."
      });
    }

    // Check whether this email already exists
    const { data: existing, error: existingError } = await supabase
      .from("admin_accounts")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered."
      });
    }

    const passwordHash = await hashPassword(password);

    // Generate a unique invite code
    let createdAdmin = null;
    let createError = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const inviteCode =
        "SUB" + crypto.randomBytes(4).toString("hex").toUpperCase();

      const { data, error } = await supabase
        .from("admin_accounts")
        .insert({
          email,
          password_hash: passwordHash,
          role: "sub_admin",
          is_active: true,
          session_version: 1,
          invite_code: inviteCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select("id, email, role, is_active, invite_code, created_at")
        .single();

      if (!error) {
        createdAdmin = data;
        break;
      }

      createError = error;

      // Retry only if invite code collided with an existing code
      if (
        !String(error.message || "").toLowerCase().includes("duplicate") &&
        error.code !== "23505"
      ) {
        throw error;
      }
    }

    if (!createdAdmin) {
      throw createError || new Error("Could not generate a unique invite code.");
    }

    return res.status(201).json({
      success: true,
      message: "Sub-Admin created successfully.",
      subAdmin: createdAdmin
    });

  } catch (error) {
    console.error("Create sub-admin error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not create Sub-Admin."
    });
  }
});


// ENABLE / DISABLE SUB-ADMIN

app.patch(
  "/api/admin/subadmins/:id/status",
  requireMainAdmin,
  async (req, res) => {
    try {
      const subAdminId = req.params.id;
      const isActive = req.body.is_active;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "is_active must be true or false."
        });
      }

      const { data: target, error: targetError } = await supabase
        .from("admin_accounts")
        .select("id, role")
        .eq("id", subAdminId)
        .maybeSingle();

      if (targetError) throw targetError;

      if (!target || target.role !== "sub_admin") {
        return res.status(404).json({
          success: false,
          message: "Sub-Admin not found."
        });
      }

      const { data: updated, error: updateError } = await supabase
        .from("admin_accounts")
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq("id", subAdminId)
        .select("id, email, role, is_active, invite_code")
        .single();

      if (updateError) throw updateError;
// Revoke all existing admin sessions after password change
const { error: revokeError } = await supabase
  .from("admin_sessions")
  .delete()
  .eq("admin_id", req.admin.id);

if (revokeError) throw revokeError;
      // Revoke all existing sessions when disabled
      if (!isActive) {
        const { error: revokeError } = await supabase
          .from("admin_sessions")
          .delete()
          .eq("admin_id", subAdminId);

        if (revokeError) throw revokeError;
      }

      return res.json({
        success: true,
        message: isActive
          ? "Sub-Admin enabled successfully."
          : "Sub-Admin disabled and sessions revoked.",
        subAdmin: updated
      });

    } catch (error) {
      console.error("Sub-admin status error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not update Sub-Admin status."
      });
    }
  }
);

// ==========================================
// CUSTOMER AUTH MIDDLEWARE FOR P2P
// ==========================================

async function requireCustomer(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Customer login required."
      });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: "Customer session invalid."
      });
    }

    req.customer = data.user;
    next();
  } catch (error) {
    console.error("Customer authorization error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Customer authorization failed."
    });
  }
}

// ==========================================
// MAIN ADMIN — EMAIL CHANGE OTP REQUEST
// ==========================================

app.post(
  "/api/admin/security/email/request",
  adminOtpLimiter,
  requireMainAdmin,
  async (req, res) => {
    let otpInserted = false;

    try {
      const currentPassword = req.body.currentPassword;
      const newEmail = String(req.body.newEmail || "").trim().toLowerCase();

      if (typeof currentPassword !== "string" || !newEmail) {
        return res.status(400).json({
          success: false,
          message: "Current password and new email are required."
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid new email."
        });
      }

      if (newEmail === req.admin.email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: "New email is already your current email."
        });
      }

      const { data: admin, error } = await supabase
        .from("admin_accounts")
        .select("id, email, password_hash")
        .eq("id", req.admin.id)
        .single();

      if (error) throw error;

      if (!(await verifyPassword(currentPassword, admin.password_hash))) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect."
        });
      }

      const { data: existing, error: existingError } = await supabase
        .from("admin_accounts")
        .select("id")
        .eq("email", newEmail)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "This email is already registered."
        });
      }

      const { data: recent, error: recentError } = await supabase
        .from("admin_email_otps")
        .select("created_at")
        .eq("admin_id", req.admin.id)
        .eq("purpose", "email_change")
        .order("created_at", { ascending: false })
        .limit(1);

      if (recentError) throw recentError;

      if (
        recent?.[0] &&
        Date.now() - new Date(recent[0].created_at).getTime() < 60000
      ) {
        return res.status(429).json({
          success: false,
          message: "Please wait 60 seconds before requesting new codes."
        });
      }

      const oldCode = String(crypto.randomInt(100000, 1000000));
      const newCode = String(crypto.randomInt(100000, 1000000));

      const oldHash = await hashPassword(oldCode);
      const newHash = await hashPassword(newCode);

      await supabase
        .from("admin_email_otps")
        .delete()
        .eq("admin_id", req.admin.id)
        .eq("purpose", "email_change");

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const { error: insertError } = await supabase
        .from("admin_email_otps")
        .insert([
          {
            admin_id: req.admin.id,
            purpose: "email_change",
            target_email: admin.email.toLowerCase(),
            code_hash: oldHash,
            expires_at: expiresAt
          },
          {
            admin_id: req.admin.id,
            purpose: "email_change",
            target_email: newEmail,
            code_hash: newHash,
            expires_at: expiresAt
          }
        ]);

      if (insertError) throw insertError;

      otpInserted = true;

      await Promise.all([
        sendAdminOTP(admin.email, oldCode, "Old email verification"),
        sendAdminOTP(newEmail, newCode, "New email verification")
      ]);

      return res.json({
        success: true,
        message: "Verification codes sent to both email addresses."
      });
    } catch (error) {
      if (otpInserted) {
        await supabase
          .from("admin_email_otps")
          .delete()
          .eq("admin_id", req.admin.id)
          .eq("purpose", "email_change");
      }

      console.error("Admin email OTP request error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not send verification codes."
      });
    }
  }
);

// ==========================================
// VERIFY BOTH EMAIL OTPs AND CHANGE ADMIN EMAIL
// ==========================================

app.post(
  "/api/admin/security/email/verify",
  adminOtpLimiter,
  requireMainAdmin,
  async (req, res) => {
    try {
      const oldCode = String(req.body.oldCode || "").trim();
      const newCode = String(req.body.newCode || "").trim();
      const newEmail = String(req.body.newEmail || "").trim().toLowerCase();

      if (
        !/^\d{6}$/.test(oldCode) ||
        !/^\d{6}$/.test(newCode) ||
        !newEmail
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter both 6-digit codes and the new email."
        });
      }

      const { data: records, error } = await supabase
        .from("admin_email_otps")
        .select("*")
        .eq("admin_id", req.admin.id)
        .eq("purpose", "email_change")
        .in("target_email", [req.admin.email.toLowerCase(), newEmail]);

      if (error) throw error;

      const oldRecord = records?.find(
        item => item.target_email.toLowerCase() === req.admin.email.toLowerCase()
      );

      const newRecord = records?.find(
        item => item.target_email.toLowerCase() === newEmail
      );

      if (!oldRecord || !newRecord) {
        return res.status(400).json({
          success: false,
          message: "Verification codes not found. Request new codes."
        });
      }

      for (const [record, code] of [
        [oldRecord, oldCode],
        [newRecord, newCode]
      ]) {
        if (
          record.verified_at ||
          new Date(record.expires_at).getTime() < Date.now()
        ) {
          return res.status(400).json({
            success: false,
            message: "A verification code has expired or already been used."
          });
        }

        if (record.attempts >= 5) {
          return res.status(429).json({
            success: false,
            message: "Too many incorrect attempts. Request new codes."
          });
        }

        const valid = await verifyPassword(code, record.code_hash);

        if (!valid) {
          await supabase
            .from("admin_email_otps")
            .update({ attempts: record.attempts + 1 })
            .eq("id", record.id);

          return res.status(400).json({
            success: false,
            message: "One of the verification codes is incorrect."
          });
        }
      }

      const { data: emailOwner, error: emailOwnerError } = await supabase
        .from("admin_accounts")
        .select("id")
        .eq("email", newEmail)
        .neq("id", req.admin.id)
        .maybeSingle();

      if (emailOwnerError) throw emailOwnerError;

      if (emailOwner) {
        return res.status(409).json({
          success: false,
          message: "This email is already registered."
        });
      }

      const { error: updateError } = await supabase
        .from("admin_accounts")
        .update({
          email: newEmail,
          session_version: (req.admin.session_version || 1) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", req.admin.id)
        .eq("email", req.admin.email);

      if (updateError) throw updateError;
// Revoke all old admin sessions after email change
const { error: revokeError } = await supabase
  .from("admin_sessions")
  .delete()
  .eq("admin_id", req.admin.id);

if (revokeError) throw revokeError;
      await supabase
        .from("admin_email_otps")
        .delete()
        .eq("admin_id", req.admin.id)
        .eq("purpose", "email_change");

      return res.json({
        success: true,
        message: "Admin email updated. Please log in again."
      });
    } catch (error) {
      console.error("Admin email OTP verification error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not verify and update admin email."
      });
    }
  }
);

// ==========================================
// MAIN ADMIN — PASSWORD CHANGE OTP REQUEST
// ==========================================

app.post(
  "/api/admin/security/password/request",
  adminOtpLimiter,
  requireMainAdmin,
  async (req, res) => {
    try {
      const currentPassword = req.body.currentPassword;
      const newPassword = req.body.newPassword;

      if (
        typeof currentPassword !== "string" ||
        typeof newPassword !== "string" ||
        newPassword.length < 8
      ) {
        return res.status(400).json({
          success: false,
          message: "Current password and a new password of at least 8 characters are required."
        });
      }

      const { data: admin, error } = await supabase
        .from("admin_accounts")
        .select("id, email, password_hash")
        .eq("id", req.admin.id)
        .single();

      if (error) throw error;

      if (!(await verifyPassword(currentPassword, admin.password_hash))) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect."
        });
      }

      const { data: recent, error: recentError } = await supabase
        .from("admin_email_otps")
        .select("created_at")
        .eq("admin_id", req.admin.id)
        .eq("purpose", "password_change")
        .order("created_at", { ascending: false })
        .limit(1);

      if (recentError) throw recentError;

      if (
        recent?.[0] &&
        Date.now() - new Date(recent[0].created_at).getTime() < 60000
      ) {
        return res.status(429).json({
          success: false,
          message: "Please wait 60 seconds before requesting a new code."
        });
      }

      const code = String(crypto.randomInt(100000, 1000000));
      const codeHash = await hashPassword(code);

      await supabase
        .from("admin_email_otps")
        .delete()
        .eq("admin_id", req.admin.id)
        .eq("purpose", "password_change");

      const { error: insertError } = await supabase
        .from("admin_email_otps")
        .insert({
          admin_id: req.admin.id,
          purpose: "password_change",
          target_email: admin.email.toLowerCase(),
          code_hash: codeHash,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        });

      if (insertError) throw insertError;

      try {
        await sendAdminOTP(admin.email, code, "Admin password change");
      } catch (mailError) {
        await supabase
          .from("admin_email_otps")
          .delete()
          .eq("admin_id", req.admin.id)
          .eq("purpose", "password_change");

        throw mailError;
      }

      return res.json({
        success: true,
        message: "Password verification code sent to your current admin email."
      });
    } catch (error) {
      console.error("Admin password OTP request error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not send password verification code."
      });
    }
  }
);

// ==========================================
// VERIFY PASSWORD OTP AND CHANGE PASSWORD
// ==========================================

app.post(
  "/api/admin/security/password/verify",
  adminOtpLimiter,
  requireMainAdmin,
  async (req, res) => {
    try {
      const code = String(req.body.code || "").trim();
      const newPassword = req.body.newPassword;

      if (
        !/^\d{6}$/.test(code) ||
        typeof newPassword !== "string" ||
        newPassword.length < 8
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter the 6-digit code and a new password of at least 8 characters."
        });
      }

      const { data: record, error } = await supabase
        .from("admin_email_otps")
        .select("*")
        .eq("admin_id", req.admin.id)
        .eq("purpose", "password_change")
        .eq("target_email", req.admin.email.toLowerCase())
        .maybeSingle();

      if (error) throw error;

      if (
        !record ||
        record.verified_at ||
        new Date(record.expires_at).getTime() < Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message: "Verification code is missing or expired. Request a new code."
        });
      }

      if (record.attempts >= 5) {
        return res.status(429).json({
          success: false,
          message: "Too many incorrect attempts. Request a new code."
        });
      }

      if (!(await verifyPassword(code, record.code_hash))) {
        await supabase
          .from("admin_email_otps")
          .update({ attempts: record.attempts + 1 })
          .eq("id", record.id);

        return res.status(400).json({
          success: false,
          message: "Incorrect verification code."
        });
      }

      const passwordHash = await hashPassword(newPassword);

      const { error: updateError } = await supabase
        .from("admin_accounts")
        .update({
          password_hash: passwordHash,
          session_version: (req.admin.session_version || 1) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", req.admin.id);

      if (updateError) throw updateError;

      await supabase
        .from("admin_email_otps")
        .delete()
        .eq("admin_id", req.admin.id)
        .eq("purpose", "password_change");

      return res.json({
        success: true,
        message: "Admin password updated. Please log in again."
      });
    } catch (error) {
      console.error("Admin password OTP verification error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not verify and update admin password."
      });
    }
  }
);

// ==========================================
// PUBLIC SETTINGS — CUSTOMER DASHBOARD
// ==========================================

app.get("/api/public/settings", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("platform_public_settings")
      .select("trc20_address, btc_address, eth_address, telegram_link, whatsapp_link, trc20_qr_url, btc_qr_url, eth_qr_url")
      .single();

    if (error) throw error;

    res.json({
      success: true,
      settings: data
    });
  } catch (error) {
    console.error("Load public settings error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not load platform settings."
    });
  }
});

// ==========================================
// ADMIN — GET PLATFORM SETTINGS
// ==========================================

app.get("/api/admin/platform-settings", requireMainAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("platform_public_settings")
      .select("*")
      .eq("id", "main")
      .single();

    if (error) throw error;

    res.json({
      success: true,
      settings: data
    });
  } catch (error) {
    console.error("Admin load platform settings:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not load platform settings."
    });
  }
});

// ==========================================
// ADMIN — UPDATE WALLET AND SUPPORT SETTINGS
// ==========================================

app.put("/api/admin/platform-settings", requireMainAdmin, async (req, res) => {
  try {
    const fields = [
      "trc20_address",
      "btc_address",
      "eth_address",
      "telegram_link",
      "whatsapp_link"
    ];

    const update = {};

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== "string") {
          return res.status(400).json({
            success: false,
            message: `${field} must be text.`
          });
        }

        update[field] = req.body[field].trim();
      }
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No settings supplied."
      });
    }

    update.id = "main";
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("platform_public_settings")
      .upsert(update, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Platform settings updated successfully.",
      settings: data
    });
  } catch (error) {
    console.error("Update platform settings:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not update platform settings."
    });
  }
});

// ==========================================
// ADMIN — DELETE PLATFORM WALLET QR
// ==========================================

app.delete(
  "/api/admin/platform-settings/qr/:asset",
  requireMainAdmin,
  async (req, res) => {
    try {
      const asset = req.params.asset.toLowerCase();

      const allowedAssets = {
        trc20: "trc20_qr_url",
        btc: "btc_qr_url",
        eth: "eth_qr_url"
      };

      const column = allowedAssets[asset];

      if (!column) {
        return res.status(400).json({
          success: false,
          message: "Invalid wallet asset."
        });
      }

      // 1. Get current QR URL
      const { data: settings, error: fetchError } = await supabase
        .from("platform_public_settings")
        .select(column)
        .eq("id", "main")
        .single();

      if (fetchError) throw fetchError;

      const qrUrl = settings?.[column];

      // 2. Delete actual image from Supabase Storage
      if (qrUrl) {
        const url = new URL(qrUrl);
        const marker = "/platform-qr-codes/";
        const index = url.pathname.indexOf(marker);

        if (index === -1) {
          throw new Error("QR image path is invalid.");
        }

        const filePath = decodeURIComponent(
          url.pathname.substring(index + marker.length)
        );

        const { data: removedFiles, error: storageError } =
          await supabase.storage
            .from("platform-qr-codes")
            .remove([filePath]);

        if (storageError) throw storageError;

        console.log("QR file deleted:", filePath);
      }

      // 3. Clear QR URL from database
      const { data, error: updateError } = await supabase
        .from("platform_public_settings")
        .update({
          [column]: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", "main")
        .select()
        .single();

      if (updateError) throw updateError;

      return res.json({
        success: true,
        message: `${asset.toUpperCase()} QR deleted successfully.`,
        settings: data
      });

    } catch (error) {
      console.error("Wallet QR delete error:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Could not delete QR image."
      });
    }
  }
);

// ==========================================
// CUSTOMER — PLACE P2P ORDER
// ==========================================

app.post("/api/p2p/orders", requireCustomer, async (req, res) => {
  try {
    const orderType = String(req.body.order_type || "").toLowerCase();
    const amount = Number(req.body.amount);
    const contactChannel = String(req.body.contact_channel || "").toLowerCase();
    const customerMessage = String(req.body.customer_message || "").trim();

    if (!["buy", "sell"].includes(orderType)) {
      return res.status(400).json({
        success: false,
        message: "Select Buy or Sell."
      });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid amount."
      });
    }

    if (!["telegram", "whatsapp"].includes(contactChannel)) {
      return res.status(400).json({
        success: false,
        message: "Select Telegram or WhatsApp support."
      });
    }

    const { data, error } = await supabase
      .from("p2p_orders")
      .insert({
        customer_id: req.customer.id,
        order_type: orderType,
        asset: "USDT",
        amount,
        contact_channel: contactChannel,
        customer_message: customerMessage
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "P2P order submitted. Please contact Customer Support.",
      order: data
    });
  } catch (error) {
    console.error("Create P2P order error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not place P2P order."
    });
  }
});

// ==========================================
// CUSTOMER — VIEW OWN P2P ORDERS
// ==========================================

app.get("/api/p2p/orders", requireCustomer, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("p2p_orders")
      .select("*")
      .eq("customer_id", req.customer.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      orders: data || []
    });
  } catch (error) {
    console.error("Customer P2P orders error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not load your P2P orders."
    });
  }
});

// ==========================================
// ADMIN — RECEIVE ALL P2P ORDERS
// ==========================================

app.get("/api/admin/p2p-orders", requireMainAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("p2p_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      orders: data || []
    });
  } catch (error) {
    console.error("Admin P2P orders error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not load P2P orders."
    });
  }
});

// ==========================================
// ADMIN — UPDATE P2P ORDER STATUS
// ==========================================

app.patch(
  "/api/admin/p2p-orders/:id",
  requireMainAdmin,
  async (req, res) => {
    try {
      const status = String(req.body.status || "").toLowerCase();

      if (!["contacted", "completed", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid P2P order status."
        });
      }

      const { data, error } = await supabase
        .from("p2p_orders")
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: "P2P order status updated.",
        order: data
      });
    } catch (error) {
      console.error("Update P2P order error:", error.message);

      res.status(500).json({
        success: false,
        message: "Could not update P2P order."
      });
    }
  }
);



// ==========================================
// GET CUSTOMERS — MAIN ADMIN AND SUB-ADMIN
// ==========================================

app.get("/api/admin/customers", requireAnyAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 100)
    );

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("profiles")
      .select("id, username, email, balance, status, created_at", {
        count: "exact"
      });

    // Sub-Admin can only see assigned customers
    if (req.admin.role === "sub_admin") {
      query = query.eq("assigned_subadmin_id", req.admin.id);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return res.json({
      success: true,
      customers: data || [],
      total: count || 0,
      page,
      limit
    });

  } catch (error) {
    console.error("Load customers error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not load customers."
    });
  }
});

// ==========================================
// ADD / DEDUCT CUSTOMER BALANCE
// MAIN ADMIN: ALL CUSTOMERS
// SUB-ADMIN: ASSIGNED CUSTOMERS ONLY
// ==========================================

app.post(
  "/api/admin/customers/:id/balance",
  requireAnyAdmin,
  async (req, res) => {
    try {
      const userId = req.params.id;
      const action = String(req.body.action || "").toLowerCase();
      const amount = Number(req.body.amount);

      if (!["add", "deduct"].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Action must be add or deduct."
        });
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid amount greater than zero."
        });
      }

      // Fetch customer ownership before changing balance
      const { data: customer, error: customerError } = await supabase
        .from("profiles")
        .select("id, assigned_subadmin_id")
        .eq("id", userId)
        .maybeSingle();

      if (customerError) throw customerError;

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found."
        });
      }

      // Sub-Admin cannot change another admin's customer balance
      if (
        req.admin.role === "sub_admin" &&
        customer.assigned_subadmin_id !== req.admin.id
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only manage your assigned customers."
        });
      }

      const { data, error } = await supabase.rpc(
        "admin_update_customer_balance",
        {
          p_user_id: userId,
          p_admin_id: req.admin.id,
          p_action: action,
          p_amount: amount
        }
      );

      if (error) throw error;

      return res.json({
        success: true,
        message: `Customer balance ${action} successful.`,
        balance: data?.[0]?.new_balance
      });

    } catch (error) {
      console.error("Customer balance update error:", error.message);

      return res.status(400).json({
        success: false,
        message: error.message || "Could not update customer balance."
      });
    }
  }
);

// ==========================================
// GET DEPOSITS
// ==========================================

app.get("/api/admin/deposits", requireMainAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("deposit_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      deposits: data || []
    });
  } catch (error) {
    console.error("Load deposits error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not load deposits."
    });
  }
});

// ==========================================
// WITHDRAWALS — TABLE NOT CREATED YET
// ==========================================

app.get("/api/admin/withdrawals", requireMainAdmin, async (req, res) => {
  return res.json({
    success: true,
    withdrawals: [],
    message: "Withdrawal requests table is not configured yet."
  });
});

// ==========================================
// CUSTOMER ADMIN SETTINGS
// ==========================================

// GET CUSTOMER SETTINGS

app.get("/api/admin/customers/:id/settings", requireMainAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const [profileResult, walletResult, tradingResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, status, status_message")
        .eq("id", userId)
        .maybeSingle(),

      supabase
        .from("customer_settings")
        .select("trc20_address, erc20_address, withdrawal_enabled, withdrawal_message")
        .eq("user_id", userId)
        .maybeSingle(),

      supabase
        .from("customer_trading_settings")
        .select("auto_trading_enabled, manual_trading_enabled, trading_enabled")
        .eq("user_id", userId)
        .maybeSingle()
    ]);

    if (profileResult.error) throw profileResult.error;
    if (walletResult.error) throw walletResult.error;
    if (tradingResult.error) throw tradingResult.error;

    if (!profileResult.data) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.json({
      success: true,
      profile: profileResult.data,
      wallet: walletResult.data || {},
      trading: tradingResult.data || {
        auto_trading_enabled: false,
        manual_trading_enabled: true,
        trading_enabled: true
      }
    });
  } catch (error) {
    console.error("Customer settings error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// SAVE CUSTOMER SETTINGS

app.put("/api/admin/customers/:id/settings", requireMainAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const {
      status,
      status_message,
      trc20_address,
      erc20_address,
      withdrawal_enabled,
      withdrawal_message,
      auto_trading_enabled,
      manual_trading_enabled,
      trading_enabled
    } = req.body;

    const allowedStatuses = ["active", "frozen", "disabled"];

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer status"
      });
    }

    // Update customer profile

    if (status !== undefined || status_message !== undefined) {
      const profileUpdate = {};

      if (status !== undefined) profileUpdate.status = status;

      if (status_message !== undefined) {
        profileUpdate.status_message = status_message;
      }

      const { error } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", userId);

      if (error) throw error;
    }

    // Update wallet and withdrawal settings

    if (
      trc20_address !== undefined ||
      erc20_address !== undefined ||
      withdrawal_enabled !== undefined ||
      withdrawal_message !== undefined
    ) {
      const walletSettings = {
        user_id: userId
      };

      if (trc20_address !== undefined) {
        walletSettings.trc20_address = trc20_address;
      }

      if (erc20_address !== undefined) {
        walletSettings.erc20_address = erc20_address;
      }

      if (withdrawal_enabled !== undefined) {
        walletSettings.withdrawal_enabled = withdrawal_enabled;
      }

      if (withdrawal_message !== undefined) {
        walletSettings.withdrawal_message = withdrawal_message;
      }

      const { error } = await supabase
        .from("customer_settings")
        .upsert(walletSettings, {
          onConflict: "user_id"
        });

      if (error) throw error;
    }

    // Update trading controls

    if (
      auto_trading_enabled !== undefined ||
      manual_trading_enabled !== undefined ||
      trading_enabled !== undefined
    ) {
      const tradingSettings = {
        user_id: userId
      };

      if (auto_trading_enabled !== undefined) {
        tradingSettings.auto_trading_enabled = auto_trading_enabled;
      }

      if (manual_trading_enabled !== undefined) {
        tradingSettings.manual_trading_enabled = manual_trading_enabled;
      }

      if (trading_enabled !== undefined) {
        tradingSettings.trading_enabled = trading_enabled;
      }

      const { error } = await supabase
        .from("customer_trading_settings")
        .upsert(tradingSettings, {
          onConflict: "user_id"
        });

      if (error) throw error;
    }

    res.json({
      success: true,
      message: "Customer settings updated successfully"
    });
  } catch (error) {
    console.error("Save customer settings error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==========================================
// CUSTOMER SECURITY SETTINGS
// ==========================================

// CHANGE CUSTOMER LOGIN PASSWORD

app.post("/api/admin/customers/:id/login-password", requireMainAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters"
      });
    }

    const { data: customer, error: customerError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (customerError) throw customerError;

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const { error } = await supabase.auth.admin.updateUserById(
      userId,
      {
        password: newPassword
      }
    );

    if (error) throw error;

    res.json({
      success: true,
      message: "Customer login password updated successfully"
    });
  } catch (error) {
    console.error("Login password update error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// RESET CUSTOMER WITHDRAWAL PASSWORD

app.post("/api/admin/customers/:id/withdrawal-password", requireMainAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (
      typeof newPassword !== "string" ||
      !/^[a-zA-Z0-9]{6,32}$/.test(newPassword)
    ) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal password must be 6-32 letters or numbers"
      });
    }

    const { data: customer, error: customerError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (customerError) throw customerError;

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const passwordHash = await hashPassword(newPassword);

    const { error } = await supabase
      .from("customer_security")
      .upsert({
        user_id: userId,
        withdrawal_password_hash: passwordHash,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id"
      });

    if (error) throw error;

    res.json({
      success: true,
      message: "Withdrawal password reset successfully"
    });
  } catch (error) {
    console.error("Withdrawal password reset error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



// ==========================================
// TRADEX BACKGROUND BINANCE MARKET FEED
// ==========================================


const marketCache = {
  spot: {},
  futures: {}
};

const marketFeedStatus = {
  spot: "connecting",
  futures: "connecting"
};

const marketLastUpdate = {
  spot: null,
  futures: null
};

const marketSockets = {
  spot: null,
  futures: null
};

const reconnectTimers = {
  spot: null,
  futures: null
};

const reconnectAttempts = {
  spot: 0,
  futures: 0
};

function updateMarketCache(type, ticker) {
  const symbol = String(ticker.s || "").toUpperCase();

if (!symbol.endsWith("USDT")) return;
  const price = Number(ticker.c);

  if (!Number.isFinite(price) || price <= 0) return;

  marketCache[type][symbol] = {
    symbol,
    price,
    change24h: Number(ticker.P || 0),
    high24h: Number(ticker.h || 0),
    low24h: Number(ticker.l || 0),
    open24h: Number(ticker.o || 0),
    volume24h: Number(ticker.v || 0),
    updatedAt: new Date().toISOString(),
    source: type === "spot"
      ? "Binance Spot"
      : "Binance USD-M Futures"
  };

  marketLastUpdate[type] = new Date().toISOString();
}

function connectMarketSocket(type) {
  if (
    marketSockets[type] &&
    (
      marketSockets[type].readyState === WebSocket.OPEN ||
      marketSockets[type].readyState === WebSocket.CONNECTING
    )
  ) {
    return;
  }
const url = type === "spot"
  ? "wss://data-stream.binance.vision/ws/!ticker@arr"
  : "wss://fstream.binance.com/ws/!ticker@arr";

  console.log(`Connecting Binance ${type.toUpperCase()} feed...`);

  const socket = new WebSocket(url, {
    handshakeTimeout: 15000
  });

  marketSockets[type] = socket;

  socket.on("open", () => {
    reconnectAttempts[type] = 0;
    marketFeedStatus[type] = "connected";

    console.log(`Binance ${type.toUpperCase()} feed connected.`);
  });

  socket.on("message", message => {
    try {
      const packet = JSON.parse(message.toString());
    const tickers = Array.isArray(packet)
  ? packet
  : Array.isArray(packet.data)
    ? packet.data
    : [packet.data || packet];

for (const ticker of tickers) {
  if (ticker && ticker.s) {
    updateMarketCache(type, ticker);
  }
}
    } catch (error) {
      console.error(`Binance ${type} message error:`, error.message);
    }
  });

  socket.on("error", error => {
    console.error(`Binance ${type} socket error:`, error.message);
  });

  socket.on("close", () => {
    if (marketSockets[type] === socket) {
      marketSockets[type] = null;
    }

    marketFeedStatus[type] = "reconnecting";

    const delay = Math.min(
      3000 * Math.pow(2, reconnectAttempts[type]),
      60000
    );

    reconnectAttempts[type]++;

    console.log(
      `Binance ${type.toUpperCase()} reconnecting in ${Math.round(delay / 1000)} seconds.`
    );

    clearTimeout(reconnectTimers[type]);

    reconnectTimers[type] = setTimeout(() => {
      connectMarketSocket(type);
    }, delay);

    reconnectTimers[type].unref?.();
  });
}
async function loadMarketSnapshot(type) {
  try {
    const url = type === "spot"
      ? "https://api.binance.com/api/v3/ticker/24hr"
      : "https://fapi.binance.com/fapi/v1/ticker/24hr";

    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`Binance HTTP ${response.status}`);
    }

    const tickers = await response.json();

    if (!Array.isArray(tickers)) {
      throw new Error("Invalid Binance response.");
    }

    for (const ticker of tickers) {
      if (!ticker.symbol || !ticker.symbol.endsWith("USDT")) {
        continue;
      }

      updateMarketCache(type, {
        s: ticker.symbol,
        c: ticker.lastPrice,
        P: ticker.priceChangePercent,
        h: ticker.highPrice,
        l: ticker.lowPrice,
        o: ticker.openPrice,
        v: ticker.volume
      });
    }

    console.log(
      `Binance ${type.toUpperCase()} snapshot loaded: ${
        Object.keys(marketCache[type]).length
      } USDT pairs.`
    );

  } catch (error) {
    console.error(
      `Binance ${type} snapshot error:`,
      error.message
    );
  }
}

// START BOTH BINANCE BACKGROUND FEEDS

loadMarketSnapshot("spot");
loadMarketSnapshot("futures");

connectMarketSocket("spot");
connectMarketSocket("futures");
// ==========================================
// END BINANCE MARKET FEED
// ==========================================
// PUBLIC MARKET DATA API

app.get("/api/markets/crypto", (req, res) => {
  const now = Date.now();

  function getMarketData(type) {
    const lastUpdate = marketLastUpdate[type];

    const isFresh =
      lastUpdate &&
      now - new Date(lastUpdate).getTime() < 30000;

    return {
      status: isFresh ? marketFeedStatus[type] : "stale",
      updatedAt: lastUpdate,
      source: type === "spot"
        ? "Binance Spot"
        : "Binance USD-M Futures",
      markets: Object.values(marketCache[type])
    };
  }

  res.set("Cache-Control", "no-store");

  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    spot: getMarketData("spot"),
    futures: getMarketData("futures")
  });
});
// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`Globelx Backend running on port ${PORT}`);
});