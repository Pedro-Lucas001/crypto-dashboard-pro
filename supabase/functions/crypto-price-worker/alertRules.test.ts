import { assertEquals } from "jsr:@std/assert@1.0.14";
import { thresholdReached } from "./alertRules.ts";

Deno.test("above triggers at or above target", () => {
  assertEquals(thresholdReached("above", 200, 200), true);
  assertEquals(thresholdReached("above", 210, 200), true);
  assertEquals(thresholdReached("above", 190, 200), false);
});
Deno.test("below triggers at or below target", () => {
  assertEquals(thresholdReached("below", 200, 200), true);
  assertEquals(thresholdReached("below", 190, 200), true);
  assertEquals(thresholdReached("below", 210, 200), false);
});
Deno.test("reject non-finite and invalid prices", () => {
  for (const invalid of [0, -1, NaN, Infinity]) {
    assertEquals(thresholdReached("above", invalid, 200), false);
    assertEquals(thresholdReached("below", 200, invalid), false);
  }
});
