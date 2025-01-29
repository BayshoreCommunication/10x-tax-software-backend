const express = require("express");
const taxRangeSheetRouter = express.Router();
const { isLoggedIn, isAdmin } = require("../middleware/auth");
const { createTaxRangeSheet, editTaxRangeSheet, getTaxRangeSheet } = require("../controllers/taxRangeSheetController");


taxRangeSheetRouter.post("/tax-range-sheet",   createTaxRangeSheet);

taxRangeSheetRouter.put("/tax-range-sheet/:id",  editTaxRangeSheet);

taxRangeSheetRouter.get("/tax-range-sheet",  getTaxRangeSheet);


module.exports =  {taxRangeSheetRouter};