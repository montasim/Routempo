import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)]
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)]
)

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
)

export const appSettings = pgTable("app_settings", {
  userId: text("user_id").primaryKey(),
  name: text("name").notNull(),
  timezone: text("timezone").notNull(),
  reminder: text("reminder").notNull(),
  notifications: boolean("notifications").default(false).notNull(),
  weeklySummary: boolean("weekly_summary").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const pushSubscriptions = pgTable(
  "push_subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("push_subscription_endpoint_idx").on(table.endpoint),
    index("push_subscription_user_id_idx").on(table.userId),
  ]
)

export const notificationDeliveries = pgTable(
  "notification_delivery",
  {
    subscriptionId: text("subscription_id").notNull(),
    deliveryKey: text("delivery_key").notNull(),
    userId: text("user_id").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.subscriptionId, table.deliveryKey] }),
    index("notification_delivery_user_id_idx").on(table.userId),
  ]
)

export const notificationJobs = pgTable(
  "notification_job",
  {
    id: text("id").primaryKey(),
    deliveryKey: text("delivery_key").notNull().unique(),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull(),
    routineId: text("routine_id"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    url: text("url").notNull(),
    status: text("status").default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notification_job_due_idx").on(table.status, table.scheduledFor),
    index("notification_job_user_id_idx").on(table.userId),
  ]
)

export const categories = pgTable(
  "category",
  {
    id: text("id").notNull(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    uniqueIndex("category_user_normalized_name_idx").on(
      table.userId,
      table.normalizedName
    ),
  ]
)

export const routines = pgTable(
  "routine",
  {
    id: text("id").notNull(),
    userId: text("user_id").notNull(),
    position: integer("position").default(0).notNull(),
    time: text("time").notNull(),
    title: text("title").notNull(),
    note: text("note").default("").notNull(),
    category: text("category").notNull(),
    startDate: date("start_date").notNull(),
    repeat: text("repeat").notNull(),
    repeatOnDay: integer("repeat_on_day"),
    repeatOnDays: integer("repeat_on_days").array(),
    repeatOnDate: integer("repeat_on_date"),
    repeatOnMonth: integer("repeat_on_month"),
    endDate: date("end_date"),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index("routine_user_id_idx").on(table.userId),
  ]
)

export const routineOccurrences = pgTable(
  "routine_occurrence",
  {
    userId: text("user_id").notNull(),
    routineId: text("routine_id").notNull(),
    occurrenceDate: date("occurrence_date").notNull(),
    status: text("status").notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.routineId, table.occurrenceDate],
    }),
    index("routine_occurrence_user_date_idx").on(
      table.userId,
      table.occurrenceDate
    ),
  ]
)

export const routineLogs = pgTable(
  "routine_log",
  {
    id: text("id").notNull(),
    userId: text("user_id").notNull(),
    routineId: text("routine_id"),
    date: text("date").notNull(),
    eventTime: text("event_time").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    scheduled: text("scheduled").notNull(),
    actual: text("actual").notNull(),
    variance: text("variance").notNull(),
    status: text("status").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
    actor: text("actor").notNull(),
    source: text("source").notNull(),
    timezone: text("timezone").notNull(),
    snapshot: text("snapshot").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index("routine_log_user_recorded_at_idx").on(
      table.userId,
      table.recordedAt
    ),
  ]
)

export const integrationItems = pgTable(
  "integration_item",
  {
    userId: text("user_id").notNull(),
    provider: text("provider").notNull(),
    resource: text("resource").notNull(),
    externalId: text("external_id").notNull(),
    routineId: text("routine_id").notNull(),
    direction: text("direction").notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.provider, table.resource, table.externalId],
    }),
    uniqueIndex("integration_item_routine_idx").on(
      table.userId,
      table.provider,
      table.resource,
      table.routineId
    ),
  ]
)
