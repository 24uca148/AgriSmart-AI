import { pgTable, text, serial, integer, doublePrecision, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullname: text("fullname").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  mobile: text("mobile").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  // Soil test report photo, stored as a base64 data URI (e.g.
  // "data:image/jpeg;base64,..."). One report per user — uploading a new
  // one replaces the previous. Null until the farmer uploads one.
  soilReportImage: text("soil_report_image"),
  soilReportUploadedAt: timestamp("soil_report_uploaded_at"),
});

// === AUTH SCHEMAS ===
const usernameSchema = z
  .string()
  .min(3, "Username must be 3-50 characters")
  .max(50, "Username must be 3-50 characters")
  .regex(/^[A-Za-z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

const mobileSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{10,15}$/, "Enter a valid mobile number (10-15 digits)");

export const registerUserSchema = z
  .object({
    fullname: z.string().min(2, "Please enter your full name"),
    username: usernameSchema,
    email: z.string().email("Please enter a valid email address"),
    mobile: mobileSchema,
    password: z.string().min(5, "Password must be at least 5 characters long"),
    confirmPassword: z.string(),
    captcha: z.string().min(1, "Please enter the security code"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Login accepts a username or email in the same field (not mobile number —
// mobile is collected at registration but isn't a login identifier).
export const loginUserSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
  captcha: z.string().min(1, "Please enter the security code"),
  adminMode: z.boolean().optional(),
});

export type RegisterUserRequest = z.infer<typeof registerUserSchema>;
export type LoginUserRequest = z.infer<typeof loginUserSchema>;

// === SOIL REPORT UPLOAD ===
// The image arrives as a base64 data URI (the client reads the selected
// file with FileReader before sending). Capped well under the server's
// 8mb JSON body limit to leave room for JSON overhead.
export const uploadSoilReportSchema = z.object({
  image: z
    .string()
    .min(1, "No image provided")
    .max(7_000_000, "Image is too large — please use a smaller photo")
    .regex(/^data:image\/(png|jpe?g|webp);base64,/, "Must be a PNG, JPEG, or WEBP image"),
});
export type UploadSoilReportRequest = z.infer<typeof uploadSoilReportSchema>;

export type User = typeof users.$inferSelect;
// Safe user shape returned to clients (never includes passwordHash)
export type PublicUser = Omit<User, "passwordHash">;
// Public user shape with the admin panel's "currently logged in" indicator
export type PublicUserWithStatus = PublicUser & { isOnline: boolean };

// === PREDICTIONS TABLE (field advisory feature) ===
// Every prediction belongs to exactly one user (userId), so each farmer
// only ever sees their own analysis history — never another user's.
export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  n: doublePrecision("n").notNull(),
  p: doublePrecision("p").notNull(),
  k: doublePrecision("k").notNull(),
  ph: doublePrecision("ph").notNull(),
  temperature: doublePrecision("temperature").notNull(),
  humidity: doublePrecision("humidity").notNull(),
  rainfall: doublePrecision("rainfall").notNull(),
  historicalPests: integer("historical_pests").notNull(), // 0 to 10 scale or count

  // Model outputs
  cropRecommendation: text("crop_recommendation").notNull(),
  yieldPrediction: doublePrecision("yield_prediction").notNull(),
  pestRisk: text("pest_risk").notNull(),
  irrigationGuidance: text("irrigation_guidance").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
  userId: true, // set server-side from the logged-in session, never from client input
  createdAt: true,
  cropRecommendation: true,
  yieldPrediction: true,
  pestRisk: true,
  irrigationGuidance: true,
});

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type PredictionRequest = InsertPrediction;
export type PredictionResponse = Prediction;
export type PredictionsListResponse = Prediction[];
