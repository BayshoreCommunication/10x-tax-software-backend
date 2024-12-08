const express = require("express");
const productRouter = express.Router();
const { isLoggedIn } = require("../middleware/auth");
const { getAllProducts, getSingleProduct, createProduct, editProduct, deleteProduct } = require("../controllers/productCtrollers");
const upload = require("../middleware/multer");
const { uploadSingle } = require("../middleware/multer");
const { uploadGallery } = require("../middleware/multer");


productRouter.get("/products", isLoggedIn, getAllProducts);
productRouter.get("/product/:id", isLoggedIn, getSingleProduct);
productRouter.post("/create-product", isLoggedIn, uploadSingle, createProduct);
productRouter.put("/edit-product/:id",  isLoggedIn, uploadSingle,  editProduct);
productRouter.delete("/delete-product/:id", isLoggedIn, deleteProduct);

module.exports = { productRouter };
