const express = require("express");
const { createTaxPlan, getTaxPlanByUserId, updateTaxPlan, deleteTaxPlan, sendTaxProposal, getProposalSend } = require("../controllers/taxPlanGeneratorController");
const textPlanGeneratorRouter = express.Router();
const { uploadSingle } = require("../middleware/multer");
const { isLoggedIn } = require("../middleware/auth");
const { uploadFileMiddleware, handleUploadError } = require("../middleware/fileUpload");


textPlanGeneratorRouter.post("/tax-plan", isLoggedIn, createTaxPlan);
textPlanGeneratorRouter.get("/tax-plan/:id",isLoggedIn,  getTaxPlanByUserId);
textPlanGeneratorRouter.put("/tax-plan/:id",isLoggedIn,  updateTaxPlan);
textPlanGeneratorRouter.delete("/tax-plan/:id",isLoggedIn, deleteTaxPlan);

textPlanGeneratorRouter.post(
  "/tax-proposal",
  isLoggedIn,
  uploadFileMiddleware,
  sendTaxProposal 
);

textPlanGeneratorRouter.get("/tax-proposal", isLoggedIn,  getProposalSend);

module.exports = textPlanGeneratorRouter;
