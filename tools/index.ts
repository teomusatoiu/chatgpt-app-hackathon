import type { ToolDefinition } from "../utils/define-tool";
import weddingContextBuilderTool from "./wedding-context-builder";
import weddingVenueStrategyTool from "./wedding-venue-strategy";
import weddingBudgetArchitectureTool from "./wedding-budget-architecture";
import weddingDesignDirectionTool from "./wedding-design-direction";
import weddingPlannerPitchTool from "./wedding-planner-pitch";

export const toolDefinitions: ToolDefinition[] = [
  weddingContextBuilderTool,
  weddingVenueStrategyTool,
  weddingBudgetArchitectureTool,
  weddingDesignDirectionTool,
  weddingPlannerPitchTool,
];
