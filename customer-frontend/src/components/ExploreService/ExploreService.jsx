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
      "Celebrate your special day with a memorable and elegant experience.",
    icon: <Heart size={48} color="black" />,
  },
  {
    name: "Birthday Party",
    description:
      "Make birthdays unforgettable with fun, laughter, and great food.",
    icon: <Cake size={48} color="black" />,
  },
  {
    name: "Anniversary",
    description: "Cherish milestones with a beautifully planned celebration.",
    icon: <Users size={48} color="black" />,
  },
  {
    name: "Corporate Event",
    description:
      "Professional and seamless events tailored for your business needs.",
    icon: <Briefcase size={48} color="black" />,
  },
  {
    name: "Debut",
    description:
      "Mark the transition to adulthood with a grand and stylish party.",
    icon: <Sparkles size={48} color="black" />,
  },
  {
    name: "Baptism/Christening",
    description:
      "A meaningful and intimate gathering for your child's blessing.",
    icon: <Droplet size={48} color="black" />,
  },
  {
    name: "Graduation",
    description:
      "Honor achievements with a joyful and well-planned celebration.",
    icon: <GraduationCap size={48} color="black" />,
  },
  {
    name: "Funeral",
    description: "A dignified and heartfelt tribute to honor your loved one.",
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
