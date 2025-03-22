import React from "react";
import "./Footer.css";
import { assets } from "../../assets/index";

const Footer = () => {
  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <img src={assets.mainLogo} alt="" />
          <p>Macky's Food Service • Your partner in every occasion</p>
          <div className="footer-social-icons">
            <a
              href="https://web.facebook.com/profile.php?id=100064143906138"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={assets.facebook_icon} alt="Facebook" />
            </a>
          </div>
        </div>
        <div className="footer-content-center">
          <h2>COMPANY</h2>
          <ul>
            <li>Home</li>
            <li>About us</li>
            <li>Privacy Policy</li>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>GET IN TOUCH</h2>
          <ul>
            <li>0920-712-9412 / 0935-827-6798</li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">
        Copyright 2020 © Macky's Food Service - All Rights Reserved
      </p>
    </div>
  );
};

export default Footer;
