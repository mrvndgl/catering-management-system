import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Reservation.css";
import { Beef, Drumstick, Fish, Salad, Soup, Utensils } from "lucide-react";
import Swal from "sweetalert2";

const BASE_PAX = 50;
const PRICE_PER_HEAD = 350;
const ADDITIONAL_ITEM_PRICE = 35;
const BASE_PRICE = BASE_PAX * PRICE_PER_HEAD;

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
    numberOfPax: "",
    timeSlot: "",
    reservation_date: "",
    venue: "",
    paymentMode: "",
    specialNotes: "",
    selectedProducts: {},
  });

  const [activeTab, setActiveTab] = useState("create"); // 'create' or 'history'
  const [reservationHistory, setReservationHistory] = useState([]);
  const [productLookup, setProductsLookup] = useState({});
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdditionalItemModal, setShowAdditionalItemModal] = useState(false);
  const [selectedAdditionalItems, setSelectedAdditionalItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [activeCategory, setActiveCategory] = useState(
    Object.keys(MENU_ITEMS)[0]
  );
  const [activeModalCategory, setActiveModalCategory] = useState(
    Object.keys(MENU_ITEMS)[0]
  );

  const [availableTimeSlots] = useState([
    { id: "Lunch", label: "Lunch (11:00 AM - 12:00 PM)" },
    { id: "Early_Dinner", label: "Early Dinner (4:00 PM - 5:00 PM)" },
    { id: "Dinner", label: "Dinner (5:00 PM - 7:00 PM)" },
  ]);

  useEffect(() => {
    calculateTotal();
  }, [
    formData.numberOfPax,
    formData.selectedProducts,
    selectedAdditionalItems,
  ]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      // Create a lookup object with product IDs as keys
      const lookup = data.reduce((acc, product) => {
        acc[product._id] = product;
        return acc;
      }, {});
      setProductsLookup(lookup);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const getProductName = (productId) => {
    return productLookup[productId]?.product_name || "Product not found";
  };

  useEffect(() => {
    fetchReservationHistory();
  }, [activeTab]);

  const fetchReservationHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setHistoryLoading(false);
        return;
      }

      setHistoryLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reservations/my-reservations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch reservation history");
      }

      const data = await response.json();

      // Additional console logs
      console.log("Raw reservation data:", JSON.stringify(data, null, 2));
      console.log("Selected products:", data.data?.[0]?.selectedProducts);
      console.log("Additional items:", data.data?.[0]?.additionalItems);

      console.log("Fetched reservation history:", data);
      setReservationHistory(data.data || []);
    } catch (error) {
      console.error("Error fetching reservation history:", error);
      setError("Failed to load reservation history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payments/${reservationId}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel reservation");
      }

      await Swal.fire({
        title: "Success!",
        text: "Your reservation has been cancelled.",
        icon: "success",
      });

      // Refresh the reservation history
      await fetchReservationHistory();
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      await Swal.fire({
        title: "Error!",
        text: error.message || "Failed to cancel reservation",
        icon: "error",
      });
    }
  };

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

    if (!formData.name || !formData.phoneNumber || !formData.numberOfPax) {
      Swal.fire({
        icon: "error",
        title: "Required Fields Missing",
        text: "Please fill in all required fields",
        confirmButtonColor: "#3085d6",
      });
      setIsSubmitting(false);
      return;
    }

    if (Object.keys(formData.selectedProducts).length === 0) {
      Swal.fire({
        icon: "error",
        title: "Menu Selection Required",
        text: "Please select at least one product",
        confirmButtonColor: "#3085d6",
      });
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
      const token = localStorage.getItem("token");

      if (!token) {
        Swal.fire({
          icon: "warning",
          title: "Authentication Required",
          text: "Please log in to make a reservation",
          confirmButtonColor: "#3085d6",
        }).then(() => {
          navigate("/login", {
            state: {
              message: "Please log in to make a reservation",
              returnTo: "/reservation",
            },
          });
        });
        return;
      }

      console.log("Sending reservation data:", reservationData);

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reservationData),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        Swal.fire({
          icon: "warning",
          title: "Session Expired",
          text: "Your session has expired. Please log in again.",
          confirmButtonColor: "#3085d6",
        }).then(() => {
          navigate("/login", {
            state: {
              message: "Your session has expired. Please log in again.",
              returnTo: "/reservation",
            },
          });
        });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create reservation");
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Reservation created successfully!",
        confirmButtonColor: "#3085d6",
      }).then(() => {
        navigate("/dashboard", {
          state: {
            notification:
              "Reservation created successfully! Please wait for admin approval.",
          },
        });
      });
    } catch (error) {
      console.error("Submission error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.message || "An unexpected error occurred. Please try again.",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="reservation-tabs">
        <button
          className={`tab-button ${activeTab === "create" ? "active" : ""}`}
          onClick={() => setActiveTab("create")}
        >
          Create Reservation
        </button>
        <button
          className={`tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Reservation History
        </button>
      </div>

      {activeTab === "create" ? (
        // Create Reservation Form
        <>
          <form onSubmit={handleSubmit} className="reservation-form">
            <div className="form-columns">
              <div className="form-column left-column">
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
              </div>

              <div className="form-column right-column">
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
                  />
                </div>
              </div>
            </div>

            <div className="menu-selection form-section">
              <h3 className="section-title">Select Menu Items</h3>

              {/* Category tabs */}
              <div className="category-tabs">
                {Object.keys(MENU_ITEMS).map((category) => (
                  <div
                    key={category}
                    className={`category-tab ${
                      activeCategory === category ? "active" : ""
                    }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    <div className="icon-container">
                      {category === "Beef" && <Beef size={24} />}
                      {category === "Pork" && <Soup size={24} />}
                      {category === "Chicken" && <Drumstick size={24} />}
                      {category === "Vegetable" && <Salad size={24} />}
                      {category === "Seafoods" && <Fish size={24} />}
                      {category === "Noodles" && <Utensils size={24} />}
                    </div>
                    <span>{category}</span>
                  </div>
                ))}
              </div>

              {/* Display products for each category */}
              {Object.entries(MENU_ITEMS).map(([category, products]) => (
                <div
                  key={category}
                  className={`category-section ${
                    activeCategory === category ? "active" : ""
                  }`}
                >
                  <div className="product-list">
                    {products.map((product) => (
                      <div
                        key={product.product_id}
                        className={`product-item ${
                          formData.selectedProducts[category] ===
                          product.product_id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => handleProductSelect(category, product)}
                      >
                        <div className="product-content">
                          <input
                            type="radio"
                            name={`product-${category}`}
                            checked={
                              formData.selectedProducts[category] ===
                              product.product_id
                            }
                            onChange={() => {}}
                          />
                          <span className="product-name">
                            {product.product_name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="additional-items-section">
              <h3>Additional Items</h3>
              <button
                type="button"
                className="add-item-btn"
                onClick={() => setShowAdditionalItemModal(true)}
              >
                Add Item
              </button>

              <div className="selected-items">
                {selectedAdditionalItems.map((itemId, index) => {
                  const item = Object.values(MENU_ITEMS)
                    .flat()
                    .find((product) => product.product_id === itemId);
                  return (
                    <div key={index} className="additional-item">
                      <span>{item?.product_name}</span>
                      <button
                        type="button"
                        className="remove-item"
                        onClick={() => removeAdditionalItem(index)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="total-amount">
              Total Amount: ₱{totalAmount.toLocaleString()}
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Reservation..." : "Create Reservation"}
            </button>
          </form>

          {showAdditionalItemModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button
                  className="close-modal-btn"
                  onClick={() => setShowAdditionalItemModal(false)}
                >
                  ×
                </button>
                <h3>Select Additional Items</h3>

                {/* Modal category tabs */}
                <div className="category-tabs">
                  {Object.keys(MENU_ITEMS).map((category) => (
                    <button
                      key={category}
                      className={`category-tab ${
                        activeModalCategory === category ? "active" : ""
                      }`}
                      onClick={() => setActiveModalCategory(category)}
                    >
                      <span>{category}</span>
                    </button>
                  ))}
                </div>

                {/* Modal category sections */}
                {Object.entries(MENU_ITEMS).map(([category, products]) => (
                  <div
                    key={category}
                    className={`category-section ${
                      activeModalCategory === category ? "active" : ""
                    }`}
                  >
                    <div className="items-grid">
                      {products.map((product) => (
                        <button
                          key={product.product_id}
                          className={`item-select-btn ${
                            selectedAdditionalItems.includes(product.product_id)
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            handleAdditionalItemSelect(category, product)
                          }
                          disabled={selectedAdditionalItems.includes(
                            product.product_id
                          )}
                        >
                          <div className="icon-container">
                            {category === "Beef" && <Beef size={20} />}
                            {category === "Pork" && <Soup size={20} />}
                            {category === "Chicken" && <Drumstick size={20} />}
                            {category === "Vegetable" && <Salad size={20} />}
                            {category === "Seafoods" && <Fish size={20} />}
                            {category === "Noodles" && <Utensils size={20} />}
                          </div>
                          {product.product_name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        // In your return statement, update the reservation history section:
        <div className="reservation-history">
          {historyLoading ? (
            <div className="loading-message">
              Loading reservation history...
            </div>
          ) : reservationHistory.length === 0 ? (
            <div className="no-reservations">No reservations found.</div>
          ) : (
            <div className="reservations-grid">
              {reservationHistory.map((reservation) => (
                <div key={reservation._id} className="reservation-card">
                  <div className="reservation-header">
                    <h3>Reservation #{reservation.reservation_id}</h3>
                    <span
                      className={`status ${reservation.reservation_status.toLowerCase()}`}
                    >
                      {reservation.reservation_status}
                    </span>
                  </div>

                  <div className="reservation-details">
                    <p>
                      <strong>Name:</strong> {reservation.name}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(
                        reservation.reservation_date
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Time Slot:</strong> {reservation.timeSlot}
                    </p>
                    <p>
                      <strong>Venue:</strong> {reservation.venue}
                    </p>
                    <p>
                      <strong>Number of Pax:</strong> {reservation.numberOfPax}
                    </p>
                    <p>
                      <strong>Payment Mode:</strong> {reservation.paymentMode}
                    </p>
                    <p className="total-amount">
                      <strong>Total Amount:</strong> ₱
                      {reservation.total_amount?.toLocaleString()}
                    </p>

                    <div className="menu-section">
                      <h4>Selected Menu Items</h4>
                      <div className="selected-items">
                        {reservation.selectedProducts &&
                          Object.entries(reservation.selectedProducts).map(
                            ([category, productId]) => (
                              <div key={category} className="menu-item">
                                <strong>{category}:</strong>{" "}
                                {getProductName(productId)}
                              </div>
                            )
                          )}
                      </div>

                      {Array.isArray(reservation.additionalItems) &&
                        reservation.additionalItems.length > 0 && (
                          <div className="additional-items">
                            <h4>Additional Items:</h4>
                            <div className="additional-items-list">
                              {reservation.additionalItems.map(
                                (itemId, index) => (
                                  <div key={index} className="menu-item">
                                    {getProductName(itemId)}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>

                    {reservation.specialNotes && (
                      <div className="special-notes">
                        <h4>Special Notes:</h4>
                        <p>{reservation.specialNotes}</p>
                      </div>
                    )}
                    {reservation.reservation_status.toLowerCase() ===
                      "pending" && (
                      <button
                        className="cancel-button"
                        onClick={() => {
                          Swal.fire({
                            title: "Cancel Reservation",
                            text: "Are you sure you want to cancel this reservation?",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#d33",
                            cancelButtonColor: "#3085d6",
                            confirmButtonText: "Yes, cancel it!",
                            cancelButtonText: "No, keep it",
                          }).then((result) => {
                            if (result.isConfirmed) {
                              handleCancelReservation(
                                reservation.reservation_id
                              );
                            }
                          });
                        }}
                      >
                        Cancel Reservation
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reservation;
