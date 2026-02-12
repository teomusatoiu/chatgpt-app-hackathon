import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBudgetPlanningBundle,
  buildPlannerPitch,
  buildVenueStrategyBrief,
  buildWeddingSnapshot,
} from "../tools/wedding-domain/engine";
import type { CoupleContextInput } from "../tools/wedding-domain/types";

const baseContext: CoupleContextInput = {
  location: "Lisbon",
  weddingDate: "2027-07-10",
  guestCount: 120,
  budgetMin: 35000,
  budgetMax: 45000,
  priorities: ["food", "elegance", "photos"],
  vibeWords: ["modern", "romantic", "minimalist"],
  nonNegotiable: "Excellent food experience",
};

test("snapshot classification returns Smart Luxury for 40k / 120 guests", () => {
  const snapshot = buildWeddingSnapshot(baseContext);
  assert.match(snapshot.budgetTierLabel, /^Smart Luxury /);
});

test("complexity score is clamped and mapped to a valid level", () => {
  const snapshot = buildWeddingSnapshot(baseContext);
  assert.ok(snapshot.complexityScore >= 0 && snapshot.complexityScore <= 100);
  assert.ok(["low", "medium", "high"].includes(snapshot.complexityLevel));
});

test("starting pillar flips to theme-first only in defined edge condition", () => {
  const themeFirstSnapshot = buildWeddingSnapshot({
    ...baseContext,
    guestCount: 50,
    budgetMin: 50000,
    budgetMax: 70000,
    priorities: ["intimacy", "elegance", "photos"],
  });
  const venueFirstSnapshot = buildWeddingSnapshot(baseContext);

  assert.equal(themeFirstSnapshot.recommendedStartingPillar, "theme-first");
  assert.equal(venueFirstSnapshot.recommendedStartingPillar, "venue-first");
});

test("venue strategy has 3 recommendations and 5 checklist items", () => {
  const brief = buildVenueStrategyBrief(baseContext);
  assert.equal(brief.recommendations.length, 3);
  assert.equal(brief.decisionChecklist.length, 5);
});

test("budget allocations always sum to 100 and buffer stays 10", () => {
  const bundle = buildBudgetPlanningBundle(baseContext);
  const total = bundle.budgetArchitecture.allocations.reduce(
    (sum, allocation) => sum + allocation.percent,
    0,
  );
  const buffer = bundle.budgetArchitecture.allocations.find(
    (allocation) => allocation.category === "Buffer",
  );

  assert.equal(Math.round(total), 100);
  assert.equal(bundle.budgetArchitecture.bufferPercent, 10);
  assert.equal(buffer?.percent, 10);
});

test("risk radar returns exactly 3 risks sorted by severity", () => {
  const bundle = buildBudgetPlanningBundle(baseContext);
  assert.equal(bundle.riskRadar.topRisks.length, 3);

  const weights = bundle.riskRadar.topRisks.map((risk) =>
    risk.severity === "high" ? 3 : risk.severity === "medium" ? 2 : 1,
  );
  for (let index = 0; index < weights.length - 1; index += 1) {
    assert.ok(weights[index] >= weights[index + 1]);
  }
});

test("planner pitch includes all required headers and 3 roadmap actions", () => {
  const pitch = buildPlannerPitch(baseContext);
  const requiredHeaders = [
    "## Opening Vision",
    "## Why We Start with the Venue",
    "## Your Budget Architecture",
    "## Design Direction",
    "## Planning Roadmap",
    "## Close with Confidence",
  ];

  requiredHeaders.forEach((header) => {
    assert.match(pitch.markdown, new RegExp(header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
  assert.equal(pitch.planningRoadmap.length, 3);
});
