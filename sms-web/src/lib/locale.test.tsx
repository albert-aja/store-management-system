import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  localizeDisplayCode,
  messageKeys,
  setLanguage,
  t,
  translateKnownBackendMessage,
} from "./locale";

afterEach(() => {
  setLanguage("en");
});

describe("management localization", () => {
  it("has an explicit translation for every catalog entry", () => {
    for (const key of messageKeys) {
      expect(t(key, "en")).toBeTruthy();
      expect(t(key, "id")).toBeTruthy();
    }
    expect(t("Stores", "id")).toBe("Toko");
    expect(t("Stores", "en")).toBe("Stores");
  });

  it("switches language and remembers the selection", () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole("button", { name: "Indonesian" }));
    expect(localStorage.getItem("sms-management-language")).toBe("id");
    expect(screen.getByRole("button", { name: "Bahasa Inggris" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Bahasa Inggris" }));
    expect(localStorage.getItem("sms-management-language")).toBe("en");
    expect(screen.getByRole("button", { name: "Indonesian" })).toBeInTheDocument();
  });

  it("formats dates and numbers by language while keeping IDR", () => {
    const date = new Date(2026, 9, 31, 12);
    expect(formatNumber(1234567, "id")).toBe("1.234.567");
    expect(formatNumber(1234567, "en")).toBe("1,234,567");
    expect(formatDate(date, "id")).toContain("Okt");
    expect(formatDate(date, "en")).toContain("Oct");
    expect(formatCurrency(1234567, "id")).toContain("Rp");
    expect(formatCurrency(1234567, "en")).toContain("IDR");
  });

  it("translates known Q.33 API errors and display-only codes without changing unknown details", () => {
    setLanguage("id");
    expect(translateKnownBackendMessage("Requested delivery window must start at least 24 hours from now"))
      .toBe("Rentang waktu pengiriman yang diminta harus dimulai setidaknya 24 jam dari sekarang");
    expect(translateKnownBackendMessage("Unrecognized server detail")).toBe("Unrecognized server detail");
    expect(localizeDisplayCode("DISPATCHED")).toBe("Diberangkatkan");
    expect(localizeDisplayCode("UNRECOGNIZED_CODE")).toBe("UNRECOGNIZED_CODE");
  });

  it("translates authored labels while preserving interpolated business values", () => {
    expect(t("Credit Score: {grade} ({points}/100)", "id", {
      grade: "A",
      points: "95",
    })).toBe("Skor Kredit: A (95/100)");
    expect(t("Version {versionCode} was deleted.", "id", {
      versionCode: "PL-20261031-001",
    })).toBe("Versi PL-20261031-001 berhasil dihapus.");
  });
});
