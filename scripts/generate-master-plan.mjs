/**
 * generate-master-plan.mjs
 * Authoritative master plan generation entry point.
 * Delegates to the 20-part modular generator in scripts/plan-generator/index.mjs
 */
import { generateMasterPlan } from './plan-generator/index.mjs';

generateMasterPlan();
