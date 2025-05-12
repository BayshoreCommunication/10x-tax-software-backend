const express = require("express");
const taxRangeSheetRouter = express.Router();
const { isLoggedIn, isAdmin } = require("../middleware/auth");
const {
  createTaxRangeSheet,
  editTaxRangeSheet,
  getTaxRangeSheet,
} = require("../controllers/taxRangeSheetController");

taxRangeSheetRouter.post(
  "/tax-range-sheet",
  isLoggedIn,
  isAdmin,
  createTaxRangeSheet
);

taxRangeSheetRouter.put(
  "/tax-range-sheet/:id",
  isLoggedIn,
  isAdmin,
  editTaxRangeSheet
);

taxRangeSheetRouter.get("/tax-range-sheet", isLoggedIn, getTaxRangeSheet);

module.exports = { taxRangeSheetRouter };
