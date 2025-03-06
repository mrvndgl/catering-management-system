import React from "react";
import "./ExploreService.css";

const services = [
  "Weddings",
  "Birthday Party",
  "Anniversary",
  "Corporate Event",
  "Debut",
  "Baptism/Christening",
  "Graduation",
  "Funeral",
];

const ExploreService = () => {
  return (
    <div className="explore-service-container">
      <h2>Explore Our Services</h2>
      <div className="services-grid">
        {services.map((service, index) => (
          <div key={index} className="service-card">
            <h3>{service}</h3>
            <p>
              Brief description of {service} services offered. You can customize
              this part.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExploreService;
