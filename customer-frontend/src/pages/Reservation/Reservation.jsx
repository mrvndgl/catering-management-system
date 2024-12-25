import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Reservation.css";

const BASE_PAX = 50;
const PRICE_PER_HEAD = 350;
const ADDITIONAL_ITEM_PRICE = 35;
const BASE_PRICE = BASE_PAX * PRICE_PER_HEAD;

// Predefined menu categories and items
const MENU_ITEMS = {
  Beef: [
    { product_id: 2, category_id: 1, product_name: "Caldereta" },
    { product_id: 40, category_id: 1, product_name: "Beef With mushroom" },
    { product_id: 3, category_id: 1, product_name: "Beef With onion" },
    { product_id: 4, category_id: 1, product_name: "Beef Stew" },
    { product_id: 5, category_id: 1, product_name: "Beef With brocolli" },
    { product_id: 6, category_id: 1, product_name: "Beef Steak" },
    { product_id: 7, category_id: 1, product_name: "Beef Laruca" },
  ],
  Pork: [
    { product_id: 8, category_id: 2, product_name: "Adobo" },
    { product_id: 9, category_id: 2, product_name: "Crispy pata" },
    { product_id: 10, category_id: 2, product_name: "Humba" },
    { product_id: 11, category_id: 2, product_name: "Menudo" },
    { product_id: 12, category_id: 2, product_name: "Sweet & sour" },
    { product_id: 13, category_id: 2, product_name: "Steak" },
    { product_id: 14, category_id: 2, product_name: "Grilled pork belly" },
    { product_id: 15, category_id: 2, product_name: "Grilled pork chop" },
    { product_id: 16, category_id: 2, product_name: "Sisig" },
  ],
  Chicken: [
    { product_id: 17, category_id: 3, product_name: "Fried Chicken" },
    { product_id: 18, category_id: 3, product_name: "Pandan" },
    { product_id: 19, category_id: 3, product_name: "Curry" },
    { product_id: 20, category_id: 3, product_name: "Chicken adobo" },
    { product_id: 21, category_id: 3, product_name: "Embutido" },
    { product_id: 22, category_id: 3, product_name: "Cordon bleu" },
  ],
  Vegetable: [
    { product_id: 23, category_id: 4, product_name: "Pinakbet" },
    { product_id: 24, category_id: 4, product_name: "Chopsuey" },
    { product_id: 25, category_id: 4, product_name: "Buttered vegetable" },
    { product_id: 26, category_id: 4, product_name: "Cabbage roll" },
    { product_id: 27, category_id: 4, product_name: "Eggplant curry" },
    { product_id: 28, category_id: 4, product_name: "Dynamite" },
  ],
  Seafoods: [
    { product_id: 29, category_id: 5, product_name: "Breaded fish fillet" },
    { product_id: 30, category_id: 5, product_name: "Calamares" },
    {
      product_id: 31,
      category_id: 5,
      product_name: "Fish fillet with sweet & sour",
    },
    { product_id: 32, category_id: 5, product_name: "Steam fish" },
    { product_id: 33, category_id: 5, product_name: "Spicy shrimp" },
  ],
  Noodles: [
    { product_id: 34, category_id: 6, product_name: "Bam e" },
    { product_id: 35, category_id: 6, product_name: "Bihon guisado" },
    { product_id: 36, category_id: 6, product_name: "Pansit guisado" },
    { product_id: 37, category_id: 6, product_name: "Spagetti" },
    { product_id: 38, category_id: 6, product_name: "Carbonara" },
    { product_id: 39, category_id: 6, product_name: "Lasagna" },
  ],
};

const Reservation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    numberOfPax: BASE_PAX,
    timeSlot: "",
    paymentMode: "",
    reservation_date: "",
    venue: "",
    selectedProducts: {},
    specialNotes: "",
  });

  const [selectedAdditionalItems, setSelectedAdditionalItems] = useState([]);
  const [showAdditionalItemModal, setShowAdditionalItemModal] = useState(false);
  const [totalAmount, setTotalAmount] = useState(BASE_PRICE);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [availableTimeSlots] = useState([
    { id: "lunch", label: "Lunch (11:00 AM - 12:00 PM)" },
    { id: "early_dinner", label: "Early Dinner (4:00 PM - 5:00 PM)" },
    { id: "dinner", label: "Dinner (5:00 PM - 7:00 PM)" },
  ]);

  useEffect(() => {
    calculateTotal();
  }, [
    formData.numberOfPax,
    formData.selectedProducts,
    selectedAdditionalItems,
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "numberOfPax") {
      if (value >= 50 && value <= 150) {
        setFormData((prev) => ({ ...prev, [name]: parseInt(value) }));
      }
    } else if (name === "phoneNumber") {
      if (value.length <= 11 && /^\d*$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProductSelect = (category, product) => {
    setFormData((prev) => ({
      ...prev,
      selectedProducts: {
        ...prev.selectedProducts,
        [category]: product.product_id,
      },
    }));
  };

  const handleAdditionalItemSelect = (category, product) => {
    setSelectedAdditionalItems((prev) => [...prev, product.product_id]);
    setShowAdditionalItemModal(false);
  };

  const removeAdditionalItem = (index) => {
    setSelectedAdditionalItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const basePriceForPax =
      BASE_PRICE + (formData.numberOfPax - BASE_PAX) * PRICE_PER_HEAD;
    const additionalItemsTotal =
      selectedAdditionalItems.length *
      formData.numberOfPax *
      ADDITIONAL_ITEM_PRICE;
    setTotalAmount(basePriceForPax + additionalItemsTotal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Validation checks
    if (!formData.name || !formData.phoneNumber || !formData.numberOfPax) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    if (Object.keys(formData.selectedProducts).length === 0) {
      setError("Please select at least one product");
      setIsSubmitting(false);
      return;
    }

    const reservationData = {
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      numberOfPax: formData.numberOfPax,
      timeSlot: formData.timeSlot,
      paymentMode: formData.paymentMode,
      reservation_date: formData.reservation_date,
      venue: formData.venue,
      selectedProducts: formData.selectedProducts,
      additionalItems: selectedAdditionalItems,
      specialNotes: formData.specialNotes,
      totalAmount: totalAmount,
    };

    try {
      // Get the authentication token
      const token = localStorage.getItem("token");

      if (!token) {
        // Redirect to login if no token is found
        navigate("/login", {
          state: {
            message: "Please log in to make a reservation",
            returnTo: "/reservation",
          },
        });
        return;
      }

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Add the auth token
        },
        body: JSON.stringify(reservationData),
      });

      if (response.status === 401) {
        // Handle unauthorized error
        localStorage.removeItem("token"); // Clear invalid token
        navigate("/login", {
          state: {
            message: "Your session has expired. Please log in again.",
            returnTo: "/reservation",
          },
        });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create reservation");
      }

      setSuccessMessage("Reservation created successfully!");

      // Wait briefly to show success message
      setTimeout(() => {
        navigate("/dashboard", {
          state: {
            notification:
              "Reservation created successfully! Please wait for admin approval.",
          },
        });
      }, 1500);
    } catch (error) {
      console.error("Submission error:", error);
      setError(
        error.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add authentication check on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", {
        state: {
          message: "Please log in to make a reservation",
          returnTo: "/reservation",
        },
      });
    }
  }, [navigate]);

  return (
    <div className="reservation-container">
      <h2>Create Reservation</h2>
      {error && <div className="error-message">{error}</div>}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="reservation-form">
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Phone Number:</label>
          <input
            type="text"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="11 digits required"
            required
          />
        </div>

        <div className="form-group">
          <label>Number of Pax:</label>
          <input
            type="number"
            name="numberOfPax"
            min="50"
            max="150"
            value={formData.numberOfPax}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Time Slot:</label>
          <select
            name="timeSlot"
            value={formData.timeSlot}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a time slot</option>
            {availableTimeSlots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Date:</label>
          <input
            type="date"
            name="reservation_date"
            value={formData.reservation_date}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Venue:</label>
          <input
            type="text"
            name="venue"
            value={formData.venue}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Payment Mode:</label>
          <div className="payment-options">
            <label>
              <input
                type="radio"
                name="paymentMode"
                value="cash"
                checked={formData.paymentMode === "cash"}
                onChange={handleInputChange}
              />
              Cash
            </label>
            <label>
              <input
                type="radio"
                name="paymentMode"
                value="gcash"
                checked={formData.paymentMode === "gcash"}
                onChange={handleInputChange}
              />
              GCash
            </label>
          </div>
        </div>
        <div className="form-group">
          <label>Special Notes:</label>
          <textarea
            name="specialNotes"
            value={formData.specialNotes}
            onChange={handleInputChange}
            placeholder="Enter any special requests or dietary requirements..."
            rows={4}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="menu-selection">
          <h3>Select Menu Items</h3>
          {Object.entries(MENU_ITEMS).map(([category, items]) => (
            <div key={category} className="category-section">
              <h4>{category}</h4>
              <div className="product-list">
                {items.map((item) => (
                  <div key={item.product_id} className="product-item">
                    <label>
                      <input
                        type="radio"
                        name={`category-${category}`}
                        checked={
                          formData.selectedProducts[category] ===
                          item.product_id
                        }
                        onChange={() => handleProductSelect(category, item)}
                      />
                      {item.product_name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Items Section */}
        <div className="additional-items-section">
          <h3>Additional Items</h3>
          <button
            type="button"
            className="add-item-button"
            onClick={() => setShowAdditionalItemModal(true)}
          >
            Add Item
          </button>

          {selectedAdditionalItems.length > 0 && (
            <div className="selected-additional-items">
              {selectedAdditionalItems.map((itemId, index) => {
                // Find the item details from MENU_ITEMS
                const item = Object.values(MENU_ITEMS)
                  .flat()
                  .find((product) => product.product_id === itemId);

                return (
                  <div key={index} className="additional-item">
                    <span>{item?.product_name}</span>
                    <button
                      type="button"
                      onClick={() => removeAdditionalItem(index)}
                      className="remove-item"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {showAdditionalItemModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Select Additional Items</h3>
                <div className="menu-categories">
                  {Object.entries(MENU_ITEMS).map(([category, items]) => (
                    <div key={category} className="category-section">
                      <h4>{category}</h4>
                      <div className="items-grid">
                        {items.map((item) => (
                          <button
                            key={item.product_id}
                            onClick={() =>
                              handleAdditionalItemSelect(category, item)
                            }
                            className="item-select-btn"
                          >
                            {item.product_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="close-modal-btn"
                  onClick={() => setShowAdditionalItemModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="total-amount">
          <h3>Total Amount: ₱{totalAmount.toLocaleString()}</h3>
        </div>

        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? "Creating Reservation..." : "Create Reservation"}
        </button>
      </form>
    </div>
  );
};

export default Reservation;
