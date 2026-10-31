import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";
import { setLanguage } from "../lib/locale";

beforeEach(() => {
  setLanguage("en");
});
