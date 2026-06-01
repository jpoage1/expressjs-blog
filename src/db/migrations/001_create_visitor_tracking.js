// src/db/migrations/001_create_visitor_tracking.js

exports.up = async (knex) => {
  // --- visitors ---
  // A unique observed identity: IP + user agent signature.
  // Classification starts as 'unknown'; you promote manually to
  // 'legitimate', 'crawler', 'suspicious', or 'bad_actor'.
  // Setting blocked = true adds them to the in-memory blocklist.
  await knex.schema.createTable("visitors", (t) => {
    t.bigIncrements("id").primary();
    t.text("ip").notNullable();
    t.text("user_agent").notNullable().defaultTo("");
    t.timestamp("first_seen", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.timestamp("last_seen", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.text("classification").notNullable().defaultTo("unknown");
    t.boolean("blocked").notNullable().defaultTo(false);
    t.text("notes");
    t.unique(["ip", "user_agent"]);
  });

  await knex.raw(`CREATE INDEX idx_visitors_ip ON visitors (ip)`);
  await knex.raw(
    `CREATE INDEX idx_visitors_blocked ON visitors (blocked) WHERE blocked = TRUE`,
  );

  // --- requests ---
  // Every non-static HTTP request the server handles. Append-only.
  // The meta JSONB column carries per-request details without schema churn:
  // directIp, latencyMs, contentLength, headers you care about, etc.
  await knex.schema.createTable("requests", (t) => {
    t.bigIncrements("id").primary();
    t.bigInteger("visitor_id")
      .notNullable()
      .references("id")
      .inTable("visitors");
    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.text("method").notNullable();
    t.text("url").notNullable();
    t.integer("status_code");
    t.text("referrer");
    t.jsonb("meta").notNullable().defaultTo("{}");
  });

  await knex.raw(`CREATE INDEX idx_requests_visitor ON requests (visitor_id)`);
  await knex.raw(`CREATE INDEX idx_requests_created ON requests (created_at)`);
  await knex.raw(`CREATE INDEX idx_requests_url ON requests (url)`);

  // --- security_flags ---
  // Automatic observations that warrant human review.
  // flag_type is one of: rate, repeat, probe, auth, reject.
  // status lifecycle: pending → reviewed | dismissed.
  await knex.schema.createTable("security_flags", (t) => {
    t.bigIncrements("id").primary();
    t.bigInteger("visitor_id")
      .notNullable()
      .references("id")
      .inTable("visitors");
    t.text("flag_type").notNullable();
    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.text("route");
    t.integer("hit_count").notNullable().defaultTo(1);
    t.text("status").notNullable().defaultTo("pending");
    t.jsonb("details").notNullable().defaultTo("{}");
  });

  await knex.raw(
    `CREATE INDEX idx_flags_visitor ON security_flags (visitor_id)`,
  );
  await knex.raw(`CREATE INDEX idx_flags_type ON security_flags (flag_type)`);
  await knex.raw(`CREATE INDEX idx_flags_status ON security_flags (status)`);
  await knex.raw(
    `CREATE INDEX idx_flags_created ON security_flags (created_at)`,
  );
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("security_flags");
  await knex.schema.dropTableIfExists("requests");
  await knex.schema.dropTableIfExists("visitors");
};
