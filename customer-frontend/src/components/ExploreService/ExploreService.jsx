import React from "react";
import "./ExploreService.css";
import serviceImage from "../../assets/service.jpg";
import {
  Heart,
  Users,
  Cake,
  Briefcase,
  Sparkles,
  Droplet,
  GraduationCap,
  Flower,
} from "lucide-react";

const services = [
  {
    name: "Weddings",
    description:
      "Sample text. Click to select the text box. Click again or double click to start editing the text. Excepteur sint occaecat cupidatat non proident.",
    icon: <Heart size={48} color="black" />,
  },
  {
    name: "Birthday Party",
    description:
      "Sample text. Click to select the text box. Click again or double click to start editing the text. Excepteur sint occaecat cupidatat non proident.",
    icon: <Cake size={48} color="black" />,
  },
  {
    name: "Anniversary",
    description:
      "Sample text. Click to select the text box. Click again or double click to start editing the text. Excepteur sint occaecat cupidatat non proident.",
    icon: <Users size={48} color="black" />,
  },
  {
    name: "Corporate Event",
    description:
      "Sample text. Click to select the text box. Click again or double click to start editing the text. Excepteur sint occaecat cupidatat non proident.",
    icon: <Briefcase size={48} color="black" />,
  },
  {
    name: "Debut",
    description:
      "Sample text. Click to select the text box. Click again or double click to start editing the text. Excepteur sint occaecat cupidatat non proident.",
    icon: <Sparkles size={48} color="black" />,
  },
  {
    name: "Baptism/Christening",
    description:
      "Sample text. Click to select the text box. Click again or double click to start editing the text. Excepteur sint occaecat cupidatat non proident.",
    icon: <Droplet size={48} color="black" />,
  },
  {
    name: "Graduation",
    description:
      "Sample text. Click to select the text box. Click again or double click to start editing the text. Excepteur sint occaecat cupidatat non proident.",
    icon: <GraduationCap size={48} color="black" />,
  },
  {
    name: "Funeral",
    description:
      "Sample text. Click to select the text box. Click again or double click to start editing the text. Excepteur sint occaecat cupidatat non proident.",
    icon: <Flower size={48} color="black" />,
  },
];

const ExploreService = () => {
  return (
    <div className="explore-service-container">
      <div className="explore-service-header">
        <div className="image-wrapper">
          <img
            src={serviceImage}
            alt="Header"
            className="explore-service-image"
          />
        </div>
        <div className="service-title-container">
          <h2 className="service-title">Our Services</h2>
        </div>
      </div>
      <div className="services-grid">
        {services.map((service, index) => (
          <div key={index} className="service-card">
            <div className="service-icon">{service.icon}</div>
            <h3>{service.name}</h3>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExploreService;
