const ClientDetails = require("../models/ClientDetailsModel");
const createError = require("http-errors");
const { successResponse } = require("./responseController");

const createClientDetails = async (req, res, next) => {
  try {

    const userId = req.user?._id;

    const { basicInformation, fillingStatus, strategy, dependents} = req.body;
    
    const newClientDetails = new ClientDetails({
      userId,
      basicInformation,
      fillingStatus,
      strategy,
      dependents,
    });

    await newClientDetails.save();

    return successResponse(res, {
      statusCode: 201,
      message: "Client details created successfully",
      payload: {}
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to create client details."));
  }
};



// get client detials by client id

const getClientDetailsById = async (req, res, next) => {
  try {
   const { id: userId } = req.params;

    const clientDetails = await ClientDetails.findOne({ userId });
    if (!clientDetails) {
      return next(createError(404, "Client details not found."));
    }

    return successResponse(res, {
      statusCode: 200,
      message:"Client details retrieved successfully",
      payload: {clientDetails}
    });

  } catch (error) {
    next(createError(500, error.message || "Failed to retrieve client details."));
  }
};

//get cleint detials data by user

const getClientsDetailsByUserId = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(createError(400, "User ID is required."));
    }

    // Parse query parameters
    const search = req.query.search?.trim() || "";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);

    // Escape special characters in the search input
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegExp = new RegExp(escapeRegExp(search), "i");

    // Define the base filter
    const filter = {
      userId, // Fetch data belonging to the current user
    };

    // If search is provided, add the $or condition
    if (search) {
      filter.$or = [
        { "basicInformation.fullName": searchRegExp },
        { "basicInformation.address": searchRegExp },
        { "basicInformation.profession": searchRegExp },
        { "basicInformation.email": searchRegExp },
        { "basicInformation.phone": searchRegExp },
      ];
    }

    // Check if any matching data exists
    const totalClients = await ClientDetails.countDocuments(filter);

    // If no data matches the search, return an empty response
    if (totalClients === 0) {
      return successResponse(res, {
        statusCode: 200,
        message: "No clients found matching the search criteria.",
        payload: {
          clients: [],
          pagination: {
            totalPages: 0,
            currentPage: 0,
            previousPage: null,
            nextPage: null,
          },
        },
      });
    }

    // Fetch matching clients with pagination
    const clients = await ClientDetails.find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const totalPages = Math.ceil(totalClients / limit);

    // Respond with the filtered and paginated data
    return successResponse(res, {
      statusCode: 200,
      message: "Client details successfully returned.",
      payload: {
        clients,
        pagination: {
          totalPages,
          currentPage: page,
          previousPage: page > 1 ? page - 1 : null,
          nextPage: page < totalPages ? page + 1 : null,
        },
      },
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to retrieve client details."));
  }
};




const updateClientDetails = async (req, res, next) => {
  try {
    const { id: _id } = req.params;
    const updateData = req.body;

    const updatedClientDetails = await ClientDetails.findOneAndUpdate(
      { _id },
      updateData,
      { new: true }
    );
    if (!updatedClientDetails) {
      return next(createError(404, "Client details not found."));
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Client details updated successfully",
      payload: {updatedClientDetails}
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to update client details."));
  }
};

const deleteClientDetails = async (req, res, next) => {
  try {
    const { id: _id } = req.params;

    // Correcting the findOneAndDelete call by passing an object with _id
    const deletedClientDetails = await ClientDetails.findOneAndDelete({ _id });
    if (!deletedClientDetails) {
      return next(createError(404, "Client details not found."));
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Client details deleted successfully",
      payload: {}
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to delete client details."));
  }
};


module.exports = {
  createClientDetails,
  getClientsDetailsByUserId,
  getClientDetailsById,
  updateClientDetails,
  deleteClientDetails,
};
