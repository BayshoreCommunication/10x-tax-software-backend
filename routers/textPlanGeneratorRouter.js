const express = require("express");
const { createTaxPlan, getTaxPlanByUserId, updateTaxPlan, deleteTaxPlan, sendTaxProposal } = require("../controllers/taxPlanGeneratorController");
const textPlanGeneratorRouter = express.Router();
const { uploadSingle } = require("../middleware/multer");
const { isLoggedIn } = require("../middleware/auth");
const { uploadFileMiddleware, handleUploadError } = require("../middleware/fileUpload");




textPlanGeneratorRouter.post("/tax-plan", createTaxPlan);
textPlanGeneratorRouter.get("/tax-plan/:id", getTaxPlanByUserId);
textPlanGeneratorRouter.put("/tax-plan/:id", updateTaxPlan);
textPlanGeneratorRouter.delete("/tax-plan/:id", deleteTaxPlan);

textPlanGeneratorRouter.post(
  "/tax-proposal",
  uploadFileMiddleware,
  sendTaxProposal 
);

module.exports = textPlanGeneratorRouter;
