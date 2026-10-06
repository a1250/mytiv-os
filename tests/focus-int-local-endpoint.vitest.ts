/** The local SQL endpoint hook can never redirect a deployed database: both URLs must be localhost. */
import { describe, expect, it } from "vitest";
import { localSqlEndpoint } from "@/lib/db/local-endpoint";

describe("lib/db local SQL endpoint (integration tests only)", () => {
  const LOCAL_DB = "postgresql://postgres@127.0.0.1:55432/focus_int";
  it("is used only when the database and the endpoint are both localhost", () => {
    expect(localSqlEndpoint(LOCAL_DB, "http://127.0.0.1:4444/sql")).toBe("http://127.0.0.1:4444/sql");
    expect(localSqlEndpoint("postgresql://u@localhost/x", "http://localhost:4444/sql")).toBe("http://localhost:4444/sql");
  });
  it("is ignored for a Neon / remote database, a remote or https endpoint, or a missing value", () => {
    expect(localSqlEndpoint("postgresql://u:p@ep-x.neon.tech/db", "http://127.0.0.1:4444/sql")).toBeNull();
    expect(localSqlEndpoint(LOCAL_DB, "http://evil.example/sql")).toBeNull();
    expect(localSqlEndpoint(LOCAL_DB, "https://127.0.0.1:4444/sql")).toBeNull();
    expect(localSqlEndpoint(LOCAL_DB, undefined)).toBeNull();
    expect(localSqlEndpoint(undefined, "http://127.0.0.1:4444/sql")).toBeNull();
    expect(localSqlEndpoint("postgresql://u@127.0.0.1.evil.example/x", "http://127.0.0.1:4444/sql")).toBeNull();
  });
});
