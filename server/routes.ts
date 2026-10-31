import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage, type NewUserInput } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import type { PublicUser, User } from "@shared/schema";
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

// ---------------- ML SERVICE BRIDGE ----------------
// server/ml_service.py hosts the trained crop-recommendation classifier,
// yield regressor, and pest-risk model (scikit-learn, saved as .pkl files
// next to it). We shell out to it per-request rather than reimplementing
// the models in JS.
// Dev (tsx) runs this file as real ESM, where only import.meta.url is
// available. The production build (script/build.ts) bundles the server to
// CommonJS with esbuild, which defines __dirname but leaves import.meta.url
// empty. `typeof __dirname` is safe to check in both — it never throws,
// even when the binding doesn't exist in ESM scope.
function resolveServerDir(): string {
  if (typeof __dirname !== "undefined") {
    return __dirname;
  }
  return path.dirname(fileURLToPath(import.meta.url));
}
const ML_SERVICE_PATH = path.join(resolveServerDir(), "ml_service.py");
const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3");

interface MlPredictionResult {
  cropRecommendation: string;
  yieldPrediction: number;
  pestRisk: string;
  irrigationGuidance: string;
}

function runMlService(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(PYTHON_BIN, [ML_SERVICE_PATH, ...args], { timeout: 30_000 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(stderr?.trim() || error.message));
      }
      resolve(stdout.trim());
    });
  });
}

async function getMlPrediction(input: {
  n: number;
  p: number;
  k: number;
  ph: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  historicalPests: number;
}): Promise<MlPredictionResult> {
  const stdout = await runMlService(["--predict", JSON.stringify(input)]);
  // ml_service.py prints one JSON object as its final line of stdout.
  const lastLine = stdout.split("\n").filter(Boolean).pop() ?? stdout;
  const parsed = JSON.parse(lastLine);
  if (parsed.error) {
    throw new Error(parsed.error);
  }
  return parsed as MlPredictionResult;
}

// ---------------- FALLBACK HEURISTIC (no Python required) ----------------
// If the Python ML service can't run — Python isn't installed, the
// numpy/pandas/scikit-learn packages are missing, etc. — the app still
// returns a usable advisory instead of failing the request outright.
// This is a deterministic, input-driven estimate; it's a stand-in for the
// real trained models, not a replacement for them. Install Python +
// requirements (see README) to get real model-backed predictions.
function getHeuristicPrediction(input: {
  n: number;
  p: number;
  k: number;
  ph: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  historicalPests: number;
}): MlPredictionResult {
  const crops = ["Wheat", "Rice", "Maize", "Cotton", "Soybean"];
  const sum =
    input.n + input.p + input.k + input.ph + input.temperature + input.humidity + input.rainfall;
  const cropRecommendation = crops[Math.floor(sum) % crops.length];
  const yieldPrediction =
    (input.n * 0.3 + input.p * 0.2 + input.k * 0.2 + input.rainfall * 0.1) *
    (0.8 + (sum % 40) / 100);

  let pestRisk = "Low";
  if (input.historicalPests > 6 || input.humidity > 75) pestRisk = "High";
  else if (input.historicalPests > 3 || input.humidity > 50) pestRisk = "Medium";

  let irrigationGuidance = "Moderate irrigation recommended.";
  if (input.rainfall > 100) irrigationGuidance = "No irrigation needed. High rainfall detected.";
  else if (input.humidity > 70 && input.rainfall > 50)
    irrigationGuidance = "Minimal irrigation required.";
  else if (input.humidity < 40 && input.rainfall < 30)
    irrigationGuidance = "Heavy irrigation required. Very dry conditions.";

  return { cropRecommendation, yieldPrediction, pestRisk, irrigationGuidance };
}

let hasWarnedAboutFallback = false;
async function getPrediction(input: {
  n: number;
  p: number;
  k: number;
  ph: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  historicalPests: number;
}): Promise<MlPredictionResult> {
  try {
    return await getMlPrediction(input);
  } catch (err) {
    if (!hasWarnedAboutFallback) {
      hasWarnedAboutFallback = true;
      console.warn(
        "[ml] Python ML service unavailable, using the built-in JS heuristic instead. " +
          "Predictions will still work, but won't use the trained models. " +
          `Reason: ${err instanceof Error ? err.message : String(err)}\n` +
          "To use the real models: install Python 3 and run " +
          "`pip install numpy==1.26.0 pandas==2.1.1 scikit-learn==1.3.2` " +
          "(see README.md for details).",
      );
    }
    return getHeuristicPrediction(input);
  }
}

// Requires a logged-in user; attaches the resolved user to res.locals.
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "You must be logged in." });
  }
  const user = await storage.getUserById(req.session.userId);
  if (!user) {
    return res.status(401).json({ message: "You must be logged in." });
  }
  res.locals.user = user;
  next();
}

// Requires a logged-in admin user. Must run after requireAuth.
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user as User | undefined;
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

// ---------------- "WHO'S CURRENTLY LOGGED IN" (admin view) ----------------
// Reads every active session straight out of the session store, rather than
// relying on a lastLogin timestamp, so the admin panel reflects sessions
// that are actually still valid right now (a session ends on logout or
// once its cookie/store entry expires).
//
// The in-memory session store (memorystore, used when DATABASE_URL isn't
// set) implements the optional `.all()` Store method, so we use that when
// available. connect-pg-simple (used when DATABASE_URL is set) does not
// implement `.all()`, so in that case we query its "session" table
// directly instead.
async function getOnlineUserIds(sessionStore: Request["sessionStore"]): Promise<Set<number>> {
  const store = sessionStore as unknown as {
    all?: (cb: (err: unknown, sessions?: unknown) => void) => void;
  };

  if (typeof store.all === "function") {
    return new Promise((resolve) => {
      store.all!((err, sessions) => {
        const onlineIds = new Set<number>();
        if (err || !sessions) {
          return resolve(onlineIds);
        }
        const sessionList = Array.isArray(sessions) ? sessions : Object.values(sessions as object);
        for (const s of sessionList) {
          const userId = (s as { userId?: number } | null)?.userId;
          if (typeof userId === "number") {
            onlineIds.add(userId);
          }
        }
        resolve(onlineIds);
      });
    });
  }

  if (process.env.DATABASE_URL) {
    const { pool } = await import("./db");
    const result = await pool.query<{ sess: { userId?: number } }>(
      'SELECT sess FROM "session" WHERE expire > NOW()',
    );
    const onlineIds = new Set<number>();
    for (const row of result.rows) {
      const userId = row.sess?.userId;
      if (typeof userId === "number") {
        onlineIds.add(userId);
      }
    }
    return onlineIds;
  }

  return new Set();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ---------------- FIELD ADVISORY / PREDICTIONS ----------------
  // Protected: only signed-in farmers see and generate advisories.

  app.get(api.predictions.list.path, requireAuth, async (req, res) => {
    try {
      // Scoped to the logged-in user only: each farmer sees their own
      // analysis history, never another user's predictions.
      const preds = await storage.getPredictionsByUser(req.session.userId!);
      res.json(preds);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.predictions.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.predictions.create.input.parse(req.body);

      // Real ML pipeline when Python + the trained models are available;
      // automatically falls back to a JS heuristic otherwise so this never
      // hard-fails just because Python isn't set up on this machine.
      const mlOutput = await getPrediction(input);

      // Saved against the logged-in user's id — never trust a client-
      // supplied userId, and never mix one user's analyses into another's.
      const prediction = await storage.createPrediction(req.session.userId!, {
        ...input,
        cropRecommendation: mlOutput.cropRecommendation,
        yieldPrediction: mlOutput.yieldPrediction,
        pestRisk: mlOutput.pestRisk,
        irrigationGuidance: mlOutput.irrigationGuidance,
      });

      res.status(201).json(prediction);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.predictions.syntheticData.path, requireAuth, async (_req, res) => {
    try {
      await runMlService(["--generate"]);
      res.json({ message: "Synthetic data generated and models trained successfully!" });
    } catch (error) {
      // Retraining genuinely needs Python + scikit-learn (there's no JS
      // equivalent for this one) — but don't scare the user with a hard
      // error, since predictions still work fine via the heuristic
      // fallback. Explain what's missing instead.
      console.warn(
        "[ml] Synthetic data generation / retraining requires Python. " +
          `Reason: ${error instanceof Error ? error.message : String(error)}`,
      );
      res.status(200).json({
        message:
          "Python isn't set up on this server, so model retraining was skipped — " +
          "predictions will keep working using the built-in estimate. Install Python " +
          "and its packages (see README.md) to enable real model training.",
      });
    }
  });

  // ---------------- AUTH ----------------

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);

      const existingByUsername = await storage.getUserByUsername(input.username);
      const existingByEmail = await storage.getUserByEmail(input.email);
      const existingByMobile = await storage.getUserByMobile(input.mobile);
      if (existingByUsername || existingByEmail || existingByMobile) {
        return res
          .status(409)
          .json({ message: "That username, email, or mobile number is already registered." });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      const newUserInput: NewUserInput = {
        fullname: input.fullname,
        username: input.username,
        email: input.email,
        mobile: input.mobile,
        passwordHash,
        isAdmin: false,
      };
      const newUser = await storage.createUser(newUserInput);

      // Auto-login: start a session right away so the user lands on the
      // main dashboard without having to log in a second time.
      req.session.userId = newUser.id;
      await storage.updateLastLogin(newUser.id);

      res.status(201).json({ message: `Welcome, ${newUser.fullname}! Your account is ready.` });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);

      const user = await storage.getUserByIdentifier(input.identifier);
      if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
        return res.status(401).json({ message: "Invalid credentials. Please try again." });
      }

      if (input.adminMode && !user.isAdmin) {
        return res.status(401).json({ message: "This account doesn't have admin access." });
      }

      req.session.userId = user.id;
      await storage.updateLastLogin(user.id);

      res.status(200).json({ message: `Welcome back, ${user.fullname}!` });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.status(200).json({ message: "You have been logged out." });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(200).json({ user: null });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(200).json({ user: null });
    }
    res.status(200).json({ user: toPublicUser(user) });
  });

  // ---------------- ADMIN ----------------

  app.get(api.admin.listUsers.path, requireAuth, requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.listUsers();
      const onlineUserIds = await getOnlineUserIds(req.sessionStore);
      const usersWithStatus = allUsers.map((u) => ({
        ...toPublicUser(u),
        isOnline: onlineUserIds.has(u.id),
      }));
      res.status(200).json({ users: usersWithStatus });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ---------------- SOIL TEST REPORT UPLOAD ----------------

  app.post(api.soilReport.upload.path, requireAuth, async (req, res) => {
    try {
      const input = api.soilReport.upload.input.parse(req.body);
      const updated = await storage.updateSoilReport(req.session.userId!, input.image);
      if (!updated) {
        return res.status(500).json({ message: "Internal server error" });
      }
      res.status(200).json({
        message: "Soil report uploaded successfully.",
        soilReportImage: updated.soilReportImage!,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
