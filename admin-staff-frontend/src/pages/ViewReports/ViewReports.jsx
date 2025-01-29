import React, { useState } from "react";
import "./ViewReports.css";

const ViewReports = ({ onGenerateReport }) => {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerateReport({ month, year });
  };

  return (
    <div className="report-form">
      <h2>Generate Monthly Report</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="month">Month:</label>
          <input
            type="month"
            id="month"
            value={`${year}-${month.padStart(2, "0")}`}
            onChange={(e) => {
              const [selectedYear, selectedMonth] = e.target.value.split("-");
              setYear(selectedYear);
              setMonth(selectedMonth);
            }}
            required
          />
        </div>
        <button type="submit" className="generate-button">
          Generate Report
        </button>
      </form>
    </div>
  );
};

export default ViewReports;
