const createError = require("http-errors");
const { successResponse } = require("./responseController");
const Category = require("../models/category");


// Create Categories

const createCategories = async (req, res, next) => {
  try {
    const { name, slug } = req.body;

    const isCategoryExists = await Category.findOne({ name }).lean();

    if (isCategoryExists) {
      throw createError(409,  "This category name already exists");
    }

    const category = new Category({ name, slug });
    await category.save();

    return successResponse(res, {
      statusCode: 201,
      message: "Category created successfully",
      payload: { category },
    });
  } catch (error) {
    next(error);
  }
};

// Get All Categories

const getAllCategories = async (req, res, next) => {
  try {
    const { search = "", page = 1, limit = 5 } = req.query;

    const escapeRegExp = (string) =>
      string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const safeSearch = escapeRegExp(search);
    const searchRegExp = new RegExp(`.*${safeSearch}.*`, "i");

    const filter = {
      $or: [{ name: searchRegExp }],
    };


    const parsedPage = Math.max(1, parseInt(page, 10)); 
    const parsedLimit = Math.max(1, parseInt(limit, 10)); 

    const [categories, count] = await Promise.all([
      Category.find(filter)
        .limit(parsedLimit)
        .skip((parsedPage - 1) * parsedLimit),
      Category.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(count / parsedLimit);

    return successResponse(res, {
      statusCode: 200,
      message: "Categories successfully retrieved",
      payload: {
        categories,
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


// Edit a Category
const editCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { name, slug },
      { new: true } 
    );

    if (!category) {
      throw createError(404, 'Category not found');
    }

    return successResponse(res, {
      statusCode: 201,
      message: "Edit category successfully",
      payload: { category },
    });
  } catch (error) {
    next(error);
  }
};

 // Delete a Category
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      throw createError(404, 'Category not found');
    }

    return successResponse(res, {
      statusCode: 201,
      message: "Deleted category successfully",
      payload: {  },
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createCategories,
  getAllCategories,
  editCategory,
  deleteCategory
};
