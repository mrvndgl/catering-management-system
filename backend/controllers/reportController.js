import Reservation from "../models/Reservation.js";

export const generateMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.params;

    if (!year || !month) {
      return res.status(400).json({
        message: "Year and month are required",
      });
    }

    // Create date range for the specified month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    console.log("Querying reservations from", startDate, "to", endDate);

    // Query reservations for the month using reservation_date instead of createdAt
    const reservations = await Reservation.find({
      reservation_date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).select("reservation_status status total_amount reservation_date");

    // Calculate statistics with case-insensitive status check
    const totalReservations = reservations.length;

    // Check both status fields since your code uses both
    const acceptedReservations = reservations.filter(
      (res) =>
        res.reservation_status?.toLowerCase() === "accepted" ||
        res.status?.toLowerCase() === "accepted"
    ).length;

    const statusCounts = reservations.reduce((acc, res) => {
      // Use reservation_status as primary, fall back to status if needed
      const status = (
        res.reservation_status ||
        res.status ||
        "Unknown"
      ).toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const totalRevenue = reservations
      .filter(
        (res) =>
          res.reservation_status?.toLowerCase() === "accepted" ||
          res.status?.toLowerCase() === "accepted"
      )
      .reduce((sum, res) => sum + (res.total_amount || 0), 0);

    console.log("Debug - Found reservations:", {
      total: totalReservations,
      accepted: acceptedReservations,
      statusCounts,
      revenue: totalRevenue,
    });

    const report = {
      period: {
        month: parseInt(month),
        year: parseInt(year),
      },
      statistics: {
        totalReservations,
        acceptedReservations,
        totalRevenue,
        statusDistribution: statusCounts,
      },
    };

    res.status(200).json(report);
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({
      message: "Failed to generate report",
      error: error.message,
    });
  }
};
