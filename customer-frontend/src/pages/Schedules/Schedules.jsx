import React, { useState, useEffect } from "react";
import "./Schedules.css";

const Schedules = () => {
  const [bookedDates, setBookedDates] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchBookedDates();
  }, [selectedMonth, selectedYear]);

  const fetchBookedDates = async () => {
    try {
      const response = await fetch(
        `/api/reservations/available-dates?month=${
          selectedMonth + 1
        }&year=${selectedYear}`
      );
      const data = await response.json();
      setBookedDates(data);
    } catch (error) {
      console.error("Error fetching booked dates:", error);
    }
  };

  const generateCalendar = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
    const calendar = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendar.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedYear, selectedMonth, day);
      const dateString = currentDate.toISOString().split("T")[0];
      const dateStatus = bookedDates.find((date) => date.date === dateString);
      calendar.push({
        day,
        status: dateStatus ? dateStatus.status : "available",
      });
    }

    return calendar;
  };

  const handleMonthChange = (increment) => {
    let newMonth = selectedMonth + increment;
    let newYear = selectedYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const renderCalendar = () => {
    const calendar = generateCalendar();
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <button onClick={() => handleMonthChange(-1)}>{"<"}</button>
          <h2>
            {months[selectedMonth]} {selectedYear}
          </h2>
          <button onClick={() => handleMonthChange(1)}>{">"}</button>
        </div>
        <div className="calendar-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="calendar-header-day">
              {day}
            </div>
          ))}
          {calendar.map((cell, index) => (
            <div
              key={index}
              className={`calendar-day 
                ${cell ? `${cell.status}-day` : "empty-day"}
              `}
            >
              {cell ? cell.day : ""}
            </div>
          ))}
        </div>
        <div className="date-legend">
          <div className="legend-item">
            <span className="legend-color available-day"></span>
            Available Dates
          </div>
          <div className="legend-item">
            <span className="legend-color booked-day"></span>
            Booked Dates
          </div>
          <div className="legend-item">
            <span className="legend-color unavailable-day"></span>
            Unavailable Dates
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="customer-schedules-container">
      <h1>Reservation Availability</h1>
      {renderCalendar()}
    </div>
  );
};

export default Schedules;
