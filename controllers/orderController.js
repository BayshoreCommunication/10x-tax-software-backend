const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const createError = require("http-errors");
const { successResponse, errorResponse } = require("./responseController");
const { stripeSecretKey } = require("../secret");
const stripe = require("stripe")(stripeSecretKey); // Replace with your Stripe secret key



// Create a new order
const createOrder = async (req, res, next) => {
  try {
    const { userId, products, totalAmount, paymentMethod } = req.body;

    if (!userId || !products || !totalAmount || !paymentMethod) {
      throw createError(400, "All fields are required");
    }

    let calculatedTotalAmount = 0;

    // Check product availability and calculate total amount
    for (const item of products) {
      const product = await Product.findById(item.product);

      if (!product || product.quantity < item.quantity) {
        throw createError(400, `Product ${product?.title || "unknown"} is out of stock or not available`);
      }

      // Calculate total cost (price * quantity)
      calculatedTotalAmount +=  item.price* item.quantity;
    }

    // Validate total amount
    if (calculatedTotalAmount !== totalAmount) {
      throw createError(
        400,
        `Total amount mismatch. Calculated: ${calculatedTotalAmount}, Provided: ${totalAmount}`
      );
    }

    // Deduct product quantities from stock
    for (const item of products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity },
      });
    }

    // Create the order
    const order = new Order({
      user: userId,
      products,
      totalAmount: calculatedTotalAmount, // Save the calculated amount
      paymentMethod,
    });

    // Save the order
    const savedOrder = await order.save();

    return successResponse(res, {
      statusCode: 201,
      message: "Order successfully created",
      payload: savedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// Get all orders by user
const getUserOrders = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ user: userId })

    return successResponse(res, {
      statusCode: 200,
      message: "Orders successfully retrieved",
      payload: orders,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single order by ID
const getSingleOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate("products.product");

    if (!order) {
      throw createError(404, "Order not found");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Order successfully retrieved",
      payload: order,
    });
  } catch (error) {
    next(error);
  }
};

// Update order status
const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      throw createError(404, "Order not found");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Order successfully updated",
      payload: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// Delete an order
const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      throw createError(404, "Order not found");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Order successfully deleted",
      payload: deletedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// Payment integration (example using Stripe)
const handlePayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const paymentMethods = await stripe.paymentMethods.list({
      customer: "cus_123456789", 
      type: "card",
    });
    
    const paymentMethodId = paymentMethods.data[0]?.id; 

    const order = await Order.findById(orderId);
    if (!order) {
      throw createError(404, "Order not found");
    }

    // Implement Stripe payment process
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.totalAmount * 100, // Amount in cents
      currency: "usd",
      payment_method: paymentMethodId,
      confirmation_method: "manual",
      confirm: true,
    });

    if (paymentIntent.status === "succeeded") {
      order.paymentStatus = "Completed";
      order.paymentTimestamp = new Date();
      order.status = "Paid";
    } else {
      order.paymentStatus = "Failed";
    }

    await order.save();

    return successResponse(res, {
      statusCode: 200,
      message: "Payment processed successfully",
      payload: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getSingleOrder,
  updateOrder,
  deleteOrder,
  handlePayment,
};
