import { describe, expect, it } from "vitest";

import { hasPermission } from "./permissions";

describe("hasPermission", () => {
  it("keeps employee access limited to ordinary operations", () => {
    expect(hasPermission("EMPLOYEE", "shifts.operate")).toBe(true);
    expect(hasPermission("EMPLOYEE", "reports.read")).toBe(false);
    expect(hasPermission("EMPLOYEE", "audit.read")).toBe(false);
    expect(hasPermission("EMPLOYEE", "profiles.manage")).toBe(false);
  });

  it("adds reporting and adjustments for managers", () => {
    expect(hasPermission("MANAGER", "reports.read")).toBe(true);
    expect(hasPermission("MANAGER", "audit.read")).toBe(true);
    expect(hasPermission("MANAGER", "inventory.adjustment")).toBe(true);
    expect(hasPermission("MANAGER", "catalogs.manage")).toBe(false);
  });

  it("grants administrators configuration capabilities", () => {
    expect(hasPermission("ADMIN", "profiles.manage")).toBe(true);
    expect(hasPermission("ADMIN", "catalogs.manage")).toBe(true);
    expect(hasPermission("ADMIN", "configuration.manage")).toBe(true);
  });
});
