import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticator } from "otplib";

// bcrypt.compare must pass for the login-path tests.
vi.mock("bcryptjs", () => ({ compare: vi.fn().mockResolvedValue(true), hash: vi.fn().mockResolvedValue("hash") }));

import { AuthService } from "./auth.service";

function makeService() {
  const db = {
    user: { findUnique: vi.fn(), update: vi.fn().mockResolvedValue({}) },
    // Pass-through for the transient-retry wrapper used by login/register.
    withRetry: <T>(fn: () => Promise<T>) => fn(),
  };
  const jwt = { sign: vi.fn().mockReturnValue("token") };
  const config = { get: vi.fn().mockReturnValue("secret") };
  const notifications = { sendPasswordReset: vi.fn().mockResolvedValue(undefined) };
  const service = new AuthService(db as never, jwt as never, config as never, notifications as never);
  return { service, db };
}

const SECRET = authenticator.generateSecret();
const baseUser = { id: "u1", email: "admin@thread.com", role: "ADMIN", passwordHash: "h", emailVerified: true };

describe("AuthService — MFA login gate", () => {
  let ctx: ReturnType<typeof makeService>;
  beforeEach(() => { ctx = makeService(); });

  it("requires a code (MFA_REQUIRED) when MFA is enabled and none is supplied", async () => {
    ctx.db.user.findUnique.mockResolvedValue({ ...baseUser, mfaEnabled: true, mfaSecret: SECRET });
    await expect(ctx.service.login({ email: baseUser.email, password: "pw" } as never))
      .rejects.toMatchObject({ response: { code: "MFA_REQUIRED" } });
  });

  it("rejects an invalid TOTP code (MFA_INVALID)", async () => {
    ctx.db.user.findUnique.mockResolvedValue({ ...baseUser, mfaEnabled: true, mfaSecret: SECRET });
    await expect(ctx.service.login({ email: baseUser.email, password: "pw", totpCode: "000000" } as never))
      .rejects.toMatchObject({ response: { code: "MFA_INVALID" } });
  });

  it("issues tokens when the correct TOTP code is supplied", async () => {
    ctx.db.user.findUnique.mockResolvedValue({ ...baseUser, mfaEnabled: true, mfaSecret: SECRET });
    const code = authenticator.generate(SECRET);
    const res = await ctx.service.login({ email: baseUser.email, password: "pw", totpCode: code } as never);
    expect(res).toHaveProperty("accessToken");
  });

  it("logs in normally when MFA is disabled", async () => {
    ctx.db.user.findUnique.mockResolvedValue({ ...baseUser, mfaEnabled: false, mfaSecret: null });
    const res = await ctx.service.login({ email: baseUser.email, password: "pw" } as never);
    expect(res).toHaveProperty("accessToken");
  });
});

describe("AuthService — MFA enrolment", () => {
  let ctx: ReturnType<typeof makeService>;
  beforeEach(() => { ctx = makeService(); });

  it("setupMfa stores a secret and returns a QR data-url", async () => {
    ctx.db.user.findUnique.mockResolvedValue({ ...baseUser, mfaEnabled: false });
    const res = await ctx.service.setupMfa("u1");
    expect(res.secret).toBeTruthy();
    expect(res.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(ctx.db.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { mfaSecret: res.secret } });
  });

  it("enableMfa turns MFA on for a correct code", async () => {
    ctx.db.user.findUnique.mockResolvedValue({ ...baseUser, mfaSecret: SECRET });
    const code = authenticator.generate(SECRET);
    await ctx.service.enableMfa("u1", code);
    expect(ctx.db.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { mfaEnabled: true } });
  });

  it("enableMfa rejects an incorrect code", async () => {
    ctx.db.user.findUnique.mockResolvedValue({ ...baseUser, mfaSecret: SECRET });
    await expect(ctx.service.enableMfa("u1", "000000")).rejects.toThrow(/Invalid authenticator code/);
  });
});
