import React from "react";
import "./ExploreService.css";
import serviceImage from "../../assets/cmslogo3.png";
import { assets } from "../../assets/index.js";

const services = [
  {
    name: "Weddings",
    description:
      "Celebrate your special day with a memorable and elegant experience.",
    image: assets.wedding,
  },
  {
    name: "Birthday Party",
    description:
      "Make birthdays unforgettable with fun, laughter, and great food.",
    image: assets.birthday,
  },
  {
    name: "Anniversary",
    description: "Cherish milestones with a beautifully planned celebration.",
    image: assets.anniversary,
  },
  {
    name: "Corporate Event",
    description:
      "Professional and seamless events tailored for your business needs.",
    image: assets.corporate,
  },
  {
    name: "Debut",
    description:
      "Mark the transition to adulthood with a grand and stylish party.",
    image: assets.debut,
  },
  {
    name: "Baptism/Christening",
    description:
      "A meaningful and intimate gathering for your child's blessing.",
    image: assets.baptism,
  },
  {
    name: "Graduation",
    description:
      "Honor achievements with a joyful and well-planned celebration.",
    image: assets.graduation,
  },
  {
    name: "Funeral",
    description: "A dignified and heartfelt tribute to honor your loved one.",
    image: assets.funeral,
  },
];

const ExploreService = () => {
  return (
    <div className="explore-service-container">
      <div className="services-layout">
        {/* Left side - Image */}
        <div className="services-image-container">
          <img
            src={serviceImage}
            alt="Catering Services"
            className="services-image"
          />
        </div>

        {/* Right side - Title and Services */}
        <div className="services-content">
          <div className="service-title-container">
            <h2 className="service-title">Our Services</h2>
          </div>

          <div className="services-grid">
            {services.map((service, index) => (
              <div
                key={index}
                className="service-card"
                style={{
                  backgroundImage: `url(${service.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="service-content-overlay">
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreService;
