const express = require("express");
const categoryRouter = express.Router();
const { createCategories, getAllCategories, editCategory, deleteCategory } = require("../controllers/categoryController");
const { isLoggedIn } = require("../middleware/auth");


categoryRouter.post("/create-categories", isLoggedIn, createCategories);
categoryRouter.get("/categories", isLoggedIn, getAllCategories);
categoryRouter.put("/edit-category/:id", isLoggedIn, editCategory);
categoryRouter.delete("/delete-category/:id", isLoggedIn, deleteCategory);

module.exports = { categoryRouter };
