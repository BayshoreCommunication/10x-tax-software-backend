const Product = require("../models/productModel");
const createError = require("http-errors");
const { successResponse } = require("./responseController");

// Get All Products
const getAllProducts = async (req, res, next) => {
  try {
    const { search = "", page = 1, limit = 5 } = req.query;

    const escapeRegExp = (string) =>
      string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const safeSearch = escapeRegExp(search);
    const searchRegExp = new RegExp(`.*${safeSearch}.*`, "i");

    const filter = {
      $or: [{ title: searchRegExp }, { description: searchRegExp }],
    };

    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, parseInt(limit, 10));

    const [products, count] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug") 
        .limit(parsedLimit)
        .skip((parsedPage - 1) * parsedLimit),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(count / parsedLimit);

    return successResponse(res, {
      statusCode: 200,
      message: "Products successfully retrieved",
      payload: {
        products,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          previousPage: parsedPage > 1 ? parsedPage - 1 : null,
          nextPage: parsedPage < totalPages ? parsedPage + 1 : null,
          totalItems: count,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Product
const getSingleProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate("category", "name slug");

    if (!product) {
      throw createError(404, "Product not found");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Product successfully retrieved",
      payload: product,
    });
  } catch (error) {
    next(error);
  }
};

// Create Product
const createProduct = async (req, res, next) => {
  try {
    const {
      title,
      description,
      regularPrice,
      discountPrice,
      retailPrice,
      category,
      quantity,
      shipping,
    } = req.body;

   

    const featureImage = req.file?.path; 
    if (!featureImage) {
      throw createError(400, "Feature image is required and should be under 10MB");
    }


    // const galleryImages = req.files?.map((file) => file.path) || []; 


    

    const product = new Product({
      title,
      description,
      regularPrice,
      discountPrice,
      retailPrice,
      image: featureImage,
      // gallery: galleryImages, 
      category,
      quantity,
      shipping,
    });

    const savedProduct = await product.save();

    return successResponse(res, {
      statusCode: 201,
      message: "Product successfully created",
      payload: savedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// Edit Product
const editProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Handle feature image update
    if (req.file) {
      const featureImage = req.file.path; // Cloudinary URL for the feature image
      updates.image = featureImage;
    }

    // Handle gallery images update
    // if (req.files) {
    //   updates.gallery = req.files.map((file) => file.path); // Cloudinary URLs for gallery images
    // }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate("category", "name slug");

    if (!updatedProduct) {
      throw createError(404, "Product not found");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Product successfully updated",
      payload: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Product
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      throw createError(404, "Product not found");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Product successfully deleted",
      payload: deletedProduct,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getSingleProduct,
  createProduct,
  editProduct,
  deleteProduct,
};
