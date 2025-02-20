const axios = require("axios");
const createError = require("http-errors");
const config = require("../config/config");
const paymentModel = require("./paymentModel");
const userModel = require("../users/userModel");
const bookingModel = require("../booking/bookingModel");

const bookingPayment = async (req, res, next) => {
  const userID = req.user.sub;
  const { bookingId } = req.body;

  try {
    const user = await userModel.findById(userID).select("username email");
    if (!user) {
      return next(createError(400, "User not found"));
    }

    const booking = await bookingModel
      .findById(bookingId)
      .select("totalAmount");
    if (!booking) {
      return next(createError(400, "Booking not found"));
    }

    if (!booking.totalAmount) {
      return next(createError(400, "Total amount is missing in booking"));
    }

    const initialPayment = await paymentModel.create({
      bookingId,
      studentId: userID,
      amount: booking.totalAmount,
      paymentMethod: "Khalti",
      status: "PENDING",
    });

    const amountInPaisa = initialPayment.amount * 100;

    console.log(initialPayment.amount);
    const paymentData = {
      return_url: `${config.BACKEND_URL}api/payments/completeKhaltiPayment`,
      website_url: `${config.BACKEND_URL}`,
      amount: amountInPaisa,
      purchase_order_id: initialPayment._id,
      purchase_order_name: "Booking Payment",
      customer_info: {
        name: user.username,
        email: user.email,
      },
    };

    const headers = {
      Authorization: `key ${config.khaltiSecretKey}`,
      "Content-Type": "application/json",
    };

    const reqOptions = {
      url: `${config.khaltiURL}/api/v2/epayment/initiate/`,
      method: "POST",
      headers,
      data: paymentData,
    };

    const paymentInitiate = await axios.request(reqOptions);

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: {
        message: "Payment Initiated Successfully",
        payment: paymentInitiate.data,
      },
    });
  } catch (error) {
    console.log(error);
    next(createError(400, `Server error while initializing payment`));
  }
};

const completeKhaltiPayment = async (req, res, next) => {
  const { pidx, transaction_id, amount, purchase_order_id } = req.query;
  const initialPaymentId = purchase_order_id;

  try {
    const headers = {
      Authorization: `key ${config.khaltiSecretKey}`,
      "Content-Type": "application/json",
    };

    const reqOptions = {
      url: `${config.khaltiURL}/api/v2/epayment/lookup/`,
      method: "POST",
      headers,
      data: JSON.stringify({ pidx }),
    };

    const paymentInfoResponse = await axios.request(reqOptions);
    const paymentInfo = paymentInfoResponse.data;

    if (!paymentInfo) {
      await paymentModel.findByIdAndUpdate(initialPaymentId, {
        status: "FAILED",
      });
      return next(createError(400, "Payment Not Verified"));
    }

    if (
      paymentInfo.status !== "Completed" ||
      paymentInfo.transaction_id !== transaction_id ||
      Number(paymentInfo.total_amount) !== Number(amount)
    ) {
      console.log("Incomplete information or verification failed");
      await paymentModel.findByIdAndUpdate(initialPaymentId, {
        status: "FAILED",
      });
      return next(createError("Verification failed"));
    } else if (paymentInfo.status === "User canceled") {
      await paymentModel.findByIdAndUpdate(initialPaymentId, {
        status: "CANCELLED",
      });
      return next(createError(400, "Payment Cancelled by User"));
    }

    const updatedPayment = await paymentModel.findByIdAndUpdate(
      initialPaymentId,
      {
        transactionId: transaction_id,
        pidx: pidx,
        status: "Completed",
      },
      { new: true }
    );

    const booking = await bookingModel.findById(updatedPayment.bookingId);
    booking.paymentStatus = "completed";
    booking.status = "ongoing";
    await booking.save();

    await userModel.findByIdAndUpdate(updatedPayment.userID, {
      $inc: { stone: updatedPayment.stonePurchased },
    });

    const khaltiRedirectUrl = `http://localhost:5173/payment-success`;
    return res.redirect(khaltiRedirectUrl);
  } catch (error) {
    await paymentModel.findByIdAndUpdate(initialPaymentId, {
      status: "Cancelled",
    });
    const khaltiRedirectUrl = `http://localhost:5173/payment-cancel`;
    console.log(`Server error while processing payment: ${error.message}`);
    return res.redirect(khaltiRedirectUrl);
  }
};

module.exports = { bookingPayment, completeKhaltiPayment };
