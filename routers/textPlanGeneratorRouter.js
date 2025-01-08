const express = require("express");
const { createTaxPlan, getTaxPlanByUserId, updateTaxPlan, deleteTaxPlan } = require("../controllers/taxPlanGeneratorController");
const textPlanGeneratorRouter = express.Router();


textPlanGeneratorRouter.post("/tax-plan", createTaxPlan);
textPlanGeneratorRouter.get("/tax-plan/:id", getTaxPlanByUserId);
textPlanGeneratorRouter.put("/tax-plan/:id", updateTaxPlan);
textPlanGeneratorRouter.delete("/tax-plan/:id", deleteTaxPlan);

module.exports = textPlanGeneratorRouter;
