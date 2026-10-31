import { eq, desc } from "drizzle-orm";
import type { User, InsertPrediction, Prediction } from "@shared/schema";
import { users, predictions } from "@shared/schema";
import bcrypt from "bcryptjs";

export interface NewUserInput {
  fullname: string;
  username: string;
  email: string;
  mobile: string;
  passwordHash: string;
  isAdmin?: boolean;
}

export interface IStorage {
  // --- users / auth ---
  createUser(input: NewUserInput): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByMobile(mobile: string): Promise<User | undefined>;
  // Looks up a user by username OR email — whichever the login form's
  // single "identifier" field was given. (Mobile number is not a login
  // identifier; it's collected at registration only.)
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  updateLastLogin(id: number): Promise<void>;
  // Stores/replaces the farmer's soil test report photo (a base64 data
  // URI). Uploading a new one overwrites the previous report.
  updateSoilReport(id: number, imageDataUri: string): Promise<User | undefined>;

  // --- field advisory predictions ---
  // Scoped to a single user: each farmer only ever sees their own
  // analysis history, never another user's.
  getPredictionsByUser(userId: number): Promise<Prediction[]>;
  createPrediction(
    userId: number,
    pred: InsertPrediction & {
      cropRecommendation: string;
      yieldPrediction: number;
      pestRisk: string;
      irrigationGuidance: string;
    },
  ): Promise<Prediction>;
}

// ---------------- IN-MEMORY FALLBACK ----------------
// Used automatically when DATABASE_URL isn't set, so the app still runs
// (with no persistence across restarts) without requiring Postgres to be
// configured first. See DbStorage below for the real database-backed
// implementation.
export class MemStorage implements IStorage {
  private users: User[] = [];
  private currentUserId = 1;
  private predictions: Prediction[] = [];
  private currentPredictionId = 1;

  constructor() {
    void this.seedDefaultAdmin();
  }

  private async seedDefaultAdmin() {
    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || "admin";
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@agrismart.local";
    const adminMobile = process.env.DEFAULT_ADMIN_MOBILE || "9999999999";

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await this.createUser({
      fullname: "Administrator",
      username: adminUsername,
      email: adminEmail,
      mobile: adminMobile,
      passwordHash,
      isAdmin: true,
    });
    // eslint-disable-next-line no-console
    console.log(
      `[auth] Seeded default admin account -> username: "${adminUsername}", password: "${adminPassword}" (change via DEFAULT_ADMIN_USERNAME / DEFAULT_ADMIN_PASSWORD env vars)`
    );
  }

  // --- users / auth ---

  async createUser(input: NewUserInput): Promise<User> {
    const newUser: User = {
      id: this.currentUserId++,
      fullname: input.fullname,
      username: input.username,
      email: input.email,
      mobile: input.mobile,
      passwordHash: input.passwordHash,
      isAdmin: input.isAdmin ?? false,
      createdAt: new Date(),
      lastLogin: null,
      soilReportImage: null,
      soilReportUploadedAt: null,
    };
    this.users.push(newUser);
    return newUser;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    return this.users.find((u) => u.mobile === mobile);
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    return (await this.getUserByUsername(identifier)) || (await this.getUserByEmail(identifier));
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async listUsers(): Promise<User[]> {
    return this.users
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateLastLogin(id: number): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.lastLogin = new Date();
    }
  }

  async updateSoilReport(id: number, imageDataUri: string): Promise<User | undefined> {
    const user = this.users.find((u) => u.id === id);
    if (!user) return undefined;
    user.soilReportImage = imageDataUri;
    user.soilReportUploadedAt = new Date();
    return user;
  }

  // --- field advisory predictions ---

  async getPredictionsByUser(userId: number): Promise<Prediction[]> {
    return this.predictions
      .filter((p) => p.userId === userId)
      .sort((a, b) => {
        const timeA = a.createdAt ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt ? b.createdAt.getTime() : 0;
        return timeA - timeB;
      });
  }

  async createPrediction(
    userId: number,
    pred: InsertPrediction & {
      cropRecommendation: string;
      yieldPrediction: number;
      pestRisk: string;
      irrigationGuidance: string;
    },
  ): Promise<Prediction> {
    const newPrediction: Prediction = {
      ...pred,
      userId,
      id: this.currentPredictionId++,
      createdAt: new Date(),
    };
    this.predictions.push(newPrediction);
    return newPrediction;
  }
}

// ---------------- POSTGRESQL-BACKED STORAGE ----------------
// Used automatically when DATABASE_URL is set. Persists users and
// predictions in real Postgres tables via Drizzle (see shared/schema.ts
// for the table definitions and server/db.ts for the connection).
export class DbStorage implements IStorage {
  private db: (typeof import("./db"))["db"];
  public ready: Promise<void>;

  constructor(db: (typeof import("./db"))["db"]) {
    this.db = db;
    this.ready = this.seedDefaultAdmin();
  }

  private async seedDefaultAdmin() {
    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || "admin";
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@agrismart.local";
    const adminMobile = process.env.DEFAULT_ADMIN_MOBILE || "9999999999";

    const existing = await this.getUserByUsername(adminUsername);
    if (existing) return;

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await this.createUser({
      fullname: "Administrator",
      username: adminUsername,
      email: adminEmail,
      mobile: adminMobile,
      passwordHash,
      isAdmin: true,
    });
    // eslint-disable-next-line no-console
    console.log(
      `[auth] Seeded default admin account -> username: "${adminUsername}", password: "${adminPassword}" (change via DEFAULT_ADMIN_USERNAME / DEFAULT_ADMIN_PASSWORD env vars)`
    );
  }

  // --- users / auth ---

  async createUser(input: NewUserInput): Promise<User> {
    const [newUser] = await this.db
      .insert(users)
      .values({
        fullname: input.fullname,
        username: input.username,
        email: input.email,
        mobile: input.mobile,
        passwordHash: input.passwordHash,
        isAdmin: input.isAdmin ?? false,
      })
      .returning();
    return newUser;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.mobile, mobile));
    return user;
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    return (await this.getUserByUsername(identifier)) || (await this.getUserByEmail(identifier));
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async listUsers(): Promise<User[]> {
    return this.db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, id));
  }

  async updateSoilReport(id: number, imageDataUri: string): Promise<User | undefined> {
    const [updated] = await this.db
      .update(users)
      .set({ soilReportImage: imageDataUri, soilReportUploadedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // --- field advisory predictions ---

  async getPredictionsByUser(userId: number): Promise<Prediction[]> {
    return this.db
      .select()
      .from(predictions)
      .where(eq(predictions.userId, userId))
      .orderBy(predictions.createdAt);
  }

  async createPrediction(
    userId: number,
    pred: InsertPrediction & {
      cropRecommendation: string;
      yieldPrediction: number;
      pestRisk: string;
      irrigationGuidance: string;
    },
  ): Promise<Prediction> {
    const [newPrediction] = await this.db
      .insert(predictions)
      .values({ ...pred, userId })
      .returning();
    return newPrediction;
  }
}

// Default to the in-memory store; initStorage() below swaps this out for
// the real Postgres-backed store when DATABASE_URL is configured. Exported
// as a mutable `let` binding (not a Promise) so existing `import { storage }
// from "./storage"` call sites elsewhere can keep using it synchronously —
// ES module bindings are live, so reassigning it here updates every import.
export let storage: IStorage = new MemStorage();

// Called once at server startup (see server/index.ts), before the HTTP
// server starts accepting requests, so `storage` is always fully resolved
// by the time any route handler runs.
export async function initStorage(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.log(
      "[storage] DATABASE_URL not set — using in-memory storage (data resets on restart). " +
        "Set DATABASE_URL to a Postgres connection string to persist data.",
    );
    return;
  }
  const { db } = await import("./db");
  const dbStorage = new DbStorage(db);
  await dbStorage.ready;
  storage = dbStorage;
  console.log("[storage] Using PostgreSQL-backed storage (DATABASE_URL is set).");
}
