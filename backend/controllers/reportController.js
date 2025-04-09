import Reservation from "../models/Reservation.js";
import Report from "../models/Report.js";

export const generateMonthlyReport = async (req, res) => {
  console.log("User info:", req.user);
  try {
    const { year, month } = req.params;

    // Convert params to numbers
    const numYear = parseInt(year);
    const numMonth = parseInt(month);

    if (isNaN(numYear) || isNaN(numMonth)) {
      return res.status(400).json({
        message: "Invalid year or month format",
      });
    }

    // Create date range for the full month
    const startDate = new Date(numYear, numMonth - 1, 1);
    const endDate = new Date(numYear, numMonth, 0, 23, 59, 59); // Last day of month

    console.log(
      `Generating monthly report for ${numMonth}/${numYear}, date range:`,
      startDate,
      "to",
      endDate
    );

    // Check if report already exists in database
    let existingReport = await Report.findOne({
      report_type: "monthly",
      start_date: startDate,
      end_date: endDate,
    });

    // If report exists and is recent, return it
    if (existingReport && Date.now() - existingReport.generated_at < 86400000) {
      // 24 hours
      console.log("Using cached monthly report");

      // Transform the monthly report data for the frontend
      const monthName = new Date(numYear, numMonth - 1, 1).toLocaleString(
        "default",
        {
          month: "long",
        }
      );

      // Calculate monthlySales from daily breakdown for the chart
      const monthlySales = existingReport.daily_breakdown
        ? existingReport.daily_breakdown.map((day) => ({
            day: new Date(day.date).getDate(),
            month: monthName,
            revenue: day.revenue,
          }))
        : [{ month: monthName, revenue: existingReport.metrics.total_revenue }];

      // Get the reservations for this period to include in the response
      const reservations = await Reservation.find({
        reservation_date: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      // Get accepted and declined reservations if available
      const acceptedReservations = reservations.filter(
        (r) =>
          r.reservation_status === "accepted" ||
          r.reservation_status === "completed"
      );

      const declinedReservations = reservations.filter(
        (r) => r.reservation_status === "declined"
      );

      return res.status(200).json({
        month: numMonth,
        monthName,
        year: numYear,
        metrics: {
          total_reservations: existingReport.metrics.total_reservations,
          accepted_reservations: existingReport.metrics.accepted_reservations,
          declined_reservations:
            existingReport.metrics.declined_reservations || 0,
          canceled_reservations: existingReport.metrics.canceled_reservations,
          total_revenue: existingReport.metrics.total_revenue,
          avg_pax_per_reservation:
            existingReport.metrics.avg_pax_per_reservation,
          monthly_sales: monthlySales,
        },
        acceptedReservations,
        declinedReservations,
      });
    }

    // If report doesn't exist or is old, generate a new one

    // Query all reservations for the month
    const reservations = await Reservation.find({
      reservation_date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    console.log(
      `Found ${reservations.length} reservations for ${numMonth}/${numYear}`
    );

    // Process daily data
    const dailyData = [];
    const daysInMonth = new Date(numYear, numMonth, 0).getDate();

    // Initialize array for all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      dailyData.push({
        day: i,
        totalReservations: 0,
        acceptedReservations: 0,
        declinedReservations: 0,
        cancelledReservations: 0,
        totalRevenue: 0,
      });
    }

    // Process each reservation
    reservations.forEach((reservation) => {
      const reservationDate = new Date(reservation.reservation_date);
      const dayIndex = reservationDate.getDate() - 1; // 0-based index for array

      // Increment counts
      dailyData[dayIndex].totalReservations++;

      // Check status
      if (
        reservation.reservation_status === "accepted" ||
        reservation.reservation_status === "completed"
      ) {
        dailyData[dayIndex].acceptedReservations++;
        dailyData[dayIndex].totalRevenue += reservation.total_amount || 0;
      } else if (reservation.reservation_status === "declined") {
        dailyData[dayIndex].declinedReservations++;
      } else if (reservation.reservation_status === "cancelled") {
        dailyData[dayIndex].cancelledReservations++;
      }
    });

    // Calculate monthly totals
    const monthlyTotals = {
      totalReservations: reservations.length,
      acceptedReservations: reservations.filter(
        (r) =>
          r.reservation_status === "accepted" ||
          r.reservation_status === "completed"
      ).length,
      declinedReservations: reservations.filter(
        (r) => r.reservation_status === "declined"
      ).length,
      cancelledReservations: reservations.filter(
        (r) => r.reservation_status === "cancelled"
      ).length,
      totalRevenue: reservations
        .filter(
          (r) =>
            r.reservation_status === "accepted" ||
            r.reservation_status === "completed"
        )
        .reduce((sum, r) => sum + (r.total_amount || 0), 0),
      avgPaxPerReservation:
        reservations.length > 0
          ? reservations.reduce(
              (sum, r) => sum + (r.numberOfPax || r.guest_count || 0),
              0
            ) / reservations.length
          : 0,
    };

    // Create daily breakdown for database
    const dailyBreakdown = dailyData.map((day, index) => {
      const dayDate = new Date(numYear, numMonth - 1, index + 1);
      return {
        date: dayDate,
        reservation_count: day.totalReservations,
        revenue: day.totalRevenue,
        guest_count: day.totalReservations, // Approximation if guest count not available
        status_counts: {
          accepted: day.acceptedReservations,
          pending: 0, // Not tracked in daily data
          canceled: day.cancelledReservations,
          completed: 0, // Not differentiated in daily data
          declined: day.declinedReservations,
        },
      };
    });

    // Generate a report ID
    const reportId = Report.generateReportId("monthly", startDate, endDate);

    const monthName = new Date(numYear, numMonth - 1, 1).toLocaleString(
      "default",
      {
        month: "long",
      }
    );

    // Create new report or update existing
    const reportData = {
      report_id: reportId,
      report_type: "monthly",
      start_date: startDate,
      end_date: endDate,
      generated_by: req.user
        ? req.user.id || req.user._id || req.user.userId || "system"
        : "system",
      generated_at: new Date(),
      metrics: {
        total_reservations: monthlyTotals.totalReservations,
        total_revenue: monthlyTotals.totalRevenue,
        total_guests: monthlyTotals.totalReservations, // Approximation
        avg_pax_per_reservation: monthlyTotals.avgPaxPerReservation,
        accepted_reservations: monthlyTotals.acceptedReservations,
        pending_reservations: 0, // Not included in monthly totals
        canceled_reservations: monthlyTotals.cancelledReservations,
        completed_reservations: 0, // Not differentiated in monthly totals
        declined_reservations: monthlyTotals.declinedReservations,
      },
      daily_breakdown: dailyBreakdown,
      summary: `Monthly report for ${monthName} ${numYear}. Total reservations: ${monthlyTotals.totalReservations}, Total revenue: ${monthlyTotals.totalRevenue}`,
      reservations_data: {
        accepted: acceptedReservations,
        declined: declinedReservations,
      },
    };

    // Save report to database (upsert)
    if (existingReport) {
      await Report.findByIdAndUpdate(existingReport._id, reportData);
    } else {
      await new Report(reportData).save();
    }

    // Format daily data for the chart (monthlySales)
    const monthlySales = dailyData.map((day, index) => ({
      day: index + 1,
      month: `Day ${index + 1}`,
      revenue: day.totalRevenue,
    }));

    // Get accepted and declined reservations
    const acceptedReservations = reservations.filter(
      (r) =>
        r.reservation_status === "accepted" ||
        r.reservation_status === "completed"
    );

    const declinedReservations = reservations.filter(
      (r) => r.reservation_status === "declined"
    );

    // Return report data in format expected by frontend
    return res.status(200).json({
      month: numMonth,
      monthName,
      year: numYear,
      metrics: {
        total_reservations: monthlyTotals.totalReservations,
        acceptedReservations,
        declinedReservations,
        canceled_reservations: monthlyTotals.cancelledReservations,
        total_revenue: monthlyTotals.totalRevenue,
        avg_pax_per_reservation: monthlyTotals.avgPaxPerReservation,
        monthly_sales: monthlySales,
      },
      acceptedReservations,
      declinedReservations,
    });
  } catch (error) {
    console.error("Monthly report generation error:", error);
    res.status(500).json({
      message: "Failed to generate monthly report",
      error: error.message,
    });
  }
};

export const generateYearlyReport = async (req, res) => {
  try {
    const { year } = req.params;

    if (!year) {
      return res.status(400).json({
        message: "Year is required",
      });
    }

    // Convert param to number
    const numYear = parseInt(year);

    if (isNaN(numYear)) {
      return res.status(400).json({
        message: "Invalid year format",
      });
    }

    // Create date range for the full year
    const startDate = new Date(numYear, 0, 1);
    const endDate = new Date(numYear, 11, 31, 23, 59, 59);

    console.log(
      `Generating yearly report for ${numYear}, date range:`,
      startDate,
      "to",
      endDate
    );

    // Check if report already exists in database
    let existingReport = await Report.findOne({
      report_type: "yearly",
      start_date: startDate,
      end_date: endDate,
    });

    // If report exists and is recent, return it
    if (existingReport && Date.now() - existingReport.generated_at < 86400000) {
      // 24 hours
      console.log("Using cached yearly report");

      // Transform the report data for the frontend
      const monthlyData = existingReport.monthly_breakdown.map((month) => ({
        month: new Date(0, month.month - 1).getMonth() + 1, // Convert month name to number
        year: month.year,
        totalReservations: month.reservation_count,
        acceptedReservations: month.status_counts.accepted,
        declinedReservations: month.status_counts.canceled,
        cancelledReservations: month.status_counts.canceled,
        totalRevenue: month.revenue,
      }));

      return res.status(200).json({
        year: numYear,
        yearTotals: {
          totalReservations: existingReport.metrics.total_reservations,
          acceptedReservations: existingReport.metrics.accepted_reservations,
          declinedReservations:
            existingReport.metrics.declined_reservations || 0,
          cancelledReservations: existingReport.metrics.canceled_reservations,
          totalRevenue: existingReport.metrics.total_revenue,
        },
        monthlyData: monthlyData,
      });
    }

    // If report doesn't exist or is old, generate a new one

    // Query all reservations for the year
    const reservations = await Reservation.find({
      reservation_date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    console.log(`Found ${reservations.length} reservations for ${numYear}`);

    // Process monthly data
    const monthlyData = [];

    // Initialize array for all months
    for (let i = 1; i <= 12; i++) {
      const monthName = new Date(numYear, i - 1, 1).toLocaleString("default", {
        month: "long",
      });
      monthlyData.push({
        month: i,
        year: numYear,
        totalReservations: 0,
        acceptedReservations: 0,
        declinedReservations: 0,
        cancelledReservations: 0,
        totalRevenue: 0,
      });
    }

    // Process each reservation
    reservations.forEach((reservation) => {
      const reservationDate = new Date(reservation.reservation_date);
      const monthIndex = reservationDate.getMonth(); // 0-11

      // Increment counts
      monthlyData[monthIndex].totalReservations++;

      // Check status
      if (
        reservation.reservation_status === "accepted" ||
        reservation.reservation_status === "completed"
      ) {
        monthlyData[monthIndex].acceptedReservations++;
        monthlyData[monthIndex].totalRevenue += reservation.total_amount || 0;
      } else if (reservation.reservation_status === "declined") {
        monthlyData[monthIndex].declinedReservations++;
      } else if (reservation.reservation_status === "cancelled") {
        monthlyData[monthIndex].cancelledReservations++;
      }
    });

    // Calculate yearly totals
    const yearTotals = {
      totalReservations: reservations.length,
      acceptedReservations: reservations.filter(
        (r) =>
          r.reservation_status === "accepted" ||
          r.reservation_status === "completed"
      ).length,
      declinedReservations: reservations.filter(
        (r) => r.reservation_status === "declined"
      ).length,
      cancelledReservations: reservations.filter(
        (r) => r.reservation_status === "cancelled"
      ).length,
      totalRevenue: reservations
        .filter(
          (r) =>
            r.reservation_status === "accepted" ||
            r.reservation_status === "completed"
        )
        .reduce((sum, r) => sum + (r.total_amount || 0), 0),
    };

    // Create report object for database
    const monthlyBreakdown = monthlyData.map((month) => ({
      month: month.month,
      year: month.year,
      reservation_count: month.totalReservations,
      revenue: month.totalRevenue,
      guest_count: month.totalReservations, // Approximation if guest count not available
      status_counts: {
        accepted: month.acceptedReservations,
        pending: 0, // Not tracked in monthly data
        canceled: month.cancelledReservations,
        completed: 0, // Not differentiated in monthly data
        declined: month.declinedReservations,
      },
    }));

    // Generate a report ID
    const reportId = Report.generateReportId("yearly", startDate, endDate);

    // Create new report or update existing
    const reportData = {
      report_id: reportId,
      report_type: "yearly",
      start_date: startDate,
      end_date: endDate,
      generated_by: req.user
        ? req.user.id || req.user._id || req.user.userId || "system"
        : "system",
      generated_at: new Date(),
      metrics: {
        total_reservations: yearTotals.totalReservations,
        total_revenue: yearTotals.totalRevenue,
        total_guests: yearTotals.totalReservations, // Approximation
        avg_pax_per_reservation:
          yearTotals.totalReservations > 0
            ? reservations.reduce(
                (sum, r) => sum + (r.numberOfPax || r.guest_count || 0),
                0
              ) / yearTotals.totalReservations
            : 0,
        accepted_reservations: yearTotals.acceptedReservations,
        pending_reservations: 0, // Not included in yearly totals
        canceled_reservations: yearTotals.cancelledReservations,
        completed_reservations: 0, // Not differentiated in yearly totals
        declined_reservations: yearTotals.declinedReservations,
      },
      monthly_breakdown: monthlyBreakdown,
      summary: `Yearly report for ${numYear}. Total reservations: ${yearTotals.totalReservations}, Total revenue: ${yearTotals.totalRevenue}`,
    };

    // Save report to database (upsert)
    if (existingReport) {
      await Report.findByIdAndUpdate(existingReport._id, reportData);
    } else {
      await new Report(reportData).save();
    }

    // Return report data
    return res.status(200).json({
      year: numYear,
      yearTotals,
      monthlyData,
    });
  } catch (error) {
    console.error("Yearly report generation error:", error);
    res.status(500).json({
      message: "Failed to generate yearly report",
      error: error.message,
    });
  }
};
