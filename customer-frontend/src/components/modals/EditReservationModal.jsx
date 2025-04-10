// Import your icons if not already imported
import { Beef, Soup, Drumstick, Salad, Fish, Utensils } from "lucide-react";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

const EditReservationModal = ({
  isOpen,
  onClose,
  reservation,
  onSave,
  menuItems,
  pricingSettings,
  availableTimeSlots,
  productsLookup,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState({
    numberOfPax: "",
    timeSlot: "",
    selectedProducts: {},
    specialNotes: "",
  });
  const [selectedAdditionalItems, setSelectedAdditionalItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [showAdditionalItemModal, setShowAdditionalItemModal] = useState(false);

  useEffect(() => {
    if (reservation) {
      setFormData({
        numberOfPax: reservation.numberOfPax,
        timeSlot: reservation.timeSlot,
        selectedProducts: reservation.selectedProducts || {},
        specialNotes: reservation.specialNotes || "",
      });

      setSelectedAdditionalItems(reservation.additionalItems || []);

      // Set active category to the first category
      if (menuItems && Object.keys(menuItems).length > 0) {
        setActiveCategory(Object.keys(menuItems)[0]);
      }
    }
  }, [reservation, menuItems]);

  // Calculate total when relevant data changes
  useEffect(() => {
    calculateTotal();
  }, [
    formData.numberOfPax,
    formData.selectedProducts,
    selectedAdditionalItems,
  ]);

  const calculateTotal = () => {
    // Only calculate if we have valid input
    if (!formData.numberOfPax) return;

    const numPax = parseInt(formData.numberOfPax);

    // Base price for the number of guests
    let basePriceForPax;
    if (numPax >= pricingSettings.basePax) {
      // Calculate additional guests beyond base package
      const additionalGuests = numPax - pricingSettings.basePax;
      basePriceForPax =
        pricingSettings.basePrice +
        additionalGuests * pricingSettings.pricePerHead;
    } else {
      // Still charge minimum base price even if fewer guests
      basePriceForPax = pricingSettings.basePrice;
    }

    // Calculate price for additional menu items selected
    const additionalItemsTotal =
      selectedAdditionalItems.length *
      numPax *
      pricingSettings.additionalItemPrice;

    setTotalAmount(basePriceForPax + additionalItemsTotal);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const addAdditionalItem = (itemId) => {
    setSelectedAdditionalItems([...selectedAdditionalItems, itemId]);
    setShowAdditionalItemModal(false);
  };

  const removeAdditionalItem = (index) => {
    const updatedItems = [...selectedAdditionalItems];
    updatedItems.splice(index, 1);
    setSelectedAdditionalItems(updatedItems);
  };

  const findProductById = (itemId) => {
    return productsLookup[itemId] || null;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Beef":
        return <Beef size={24} />;
      case "Pork":
        return <Soup size={24} />;
      case "Chicken":
        return <Drumstick size={24} />;
      case "Vegetable":
      case "Vegetables":
        return <Salad size={24} />;
      case "Seafood":
      case "Seafoods":
        return <Fish size={24} />;
      case "Noodles":
        return <Utensils size={24} />;
      default:
        return null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.numberOfPax) {
      Swal.fire({
        icon: "error",
        title: "Required Fields Missing",
        text: "Please fill in all required fields",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (Object.keys(formData.selectedProducts).length === 0) {
      Swal.fire({
        icon: "error",
        title: "Menu Selection Required",
        text: "Please select at least one product",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Create updated reservation object
    const updatedReservation = {
      ...reservation,
      numberOfPax: formData.numberOfPax,
      timeSlot: formData.timeSlot,
      selectedProducts: formData.selectedProducts,
      additionalItems: selectedAdditionalItems,
      specialNotes: formData.specialNotes,
      total_amount: totalAmount,
      pricingDetails: {
        basePax: pricingSettings.basePax,
        pricePerHead: pricingSettings.pricePerHead,
        additionalItemPrice: pricingSettings.additionalItemPrice,
      },
    };

    onSave(updatedReservation);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content edit-reservation-modal">
        <div className="modal-header">
          <h2>Edit Reservation</h2>
          <button type="button" className="close-modal" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-reservation-form">
          <div className="form-group">
            <label>Number of Pax:</label>
            <input
              type="number"
              name="numberOfPax"
              min={pricingSettings?.basePax > 0 ? 1 : 50}
              max="150"
              value={formData.numberOfPax}
              onChange={handleInputChange}
              required
            />
            <small className="pricing-note">
              Base price is for {pricingSettings?.basePax} guests. Additional
              guests: ₱{pricingSettings?.pricePerHead} per person.
            </small>
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
              {availableTimeSlots?.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.label}
                </option>
              ))}
            </select>
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

          <div className="menu-selection form-section">
            <h3 className="section-title">Select Menu Items</h3>

            {/* Category tabs */}
            <div className="category-tabs">
              {menuItems &&
                Object.keys(menuItems).map((category) => (
                  <div
                    key={category}
                    className={`category-tab ${
                      activeCategory === category ? "active" : ""
                    }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    <div className="icon-container">
                      {getCategoryIcon(category)}
                    </div>
                    <span>{category}</span>
                  </div>
                ))}
            </div>

            {/* Display products for each category */}
            {menuItems &&
              Object.entries(menuItems).map(([category, products]) => (
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
            <div className="additional-items-info">
              <p>
                Additional items: ₱{pricingSettings?.additionalItemPrice} per
                person, per item
              </p>
            </div>
            <button
              type="button"
              className="add-item-btn"
              onClick={() => setShowAdditionalItemModal(true)}
            >
              Add Item
            </button>

            <div className="selected-items">
              {selectedAdditionalItems
                .map((itemId) => findProductById(itemId))
                .filter((item) => item !== null)
                .map((item, index) => (
                  <div key={index} className="additional-item">
                    <span>{item.product_name}</span>
                    <button
                      type="button"
                      className="remove-item"
                      onClick={() => removeAdditionalItem(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>
          </div>

          <div className="pricing-breakdown">
            <h3>Pricing Breakdown</h3>
            <div className="pricing-details">
              <div className="pricing-row">
                <p>
                  Base Package: ₱{pricingSettings?.basePrice.toLocaleString()}{" "}
                  for {pricingSettings?.basePax} guests
                </p>
                <p>
                  Additional Items: ₱{pricingSettings?.additionalItemPrice} per
                  person, per item
                </p>
              </div>

              {formData.numberOfPax &&
                parseInt(formData.numberOfPax) > pricingSettings?.basePax && (
                  <div className="pricing-row">
                    <span>
                      Additional Guests (
                      {parseInt(formData.numberOfPax) -
                        pricingSettings?.basePax}{" "}
                      × ₱{pricingSettings?.pricePerHead}):
                    </span>
                    <span>
                      ₱
                      {(
                        (parseInt(formData.numberOfPax) -
                          pricingSettings?.basePax) *
                        pricingSettings?.pricePerHead
                      ).toLocaleString()}
                    </span>
                  </div>
                )}

              {selectedAdditionalItems.length > 0 && formData.numberOfPax && (
                <div className="pricing-row">
                  <span>
                    Additional Items ({selectedAdditionalItems.length} items ×{" "}
                    {formData.numberOfPax} guests × ₱
                    {pricingSettings?.additionalItemPrice}):
                  </span>
                  <span>
                    ₱
                    {(
                      selectedAdditionalItems.length *
                      parseInt(formData.numberOfPax) *
                      pricingSettings?.additionalItemPrice
                    ).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="pricing-row total">
                <span>Total Amount:</span>
                <span>₱{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Additional Item Modal */}
        {showAdditionalItemModal && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Select Additional Item</h2>
                <button
                  type="button"
                  className="close-modal"
                  onClick={() => setShowAdditionalItemModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                {/* Category tabs for modal */}
                <div className="modal-category-tabs">
                  {menuItems &&
                    Object.keys(menuItems).map((category) => (
                      <div
                        key={category}
                        className={`modal-category-tab ${
                          activeCategory === category ? "active" : ""
                        }`}
                        onClick={() => setActiveCategory(category)}
                      >
                        <span>{category}</span>
                      </div>
                    ))}
                </div>

                {/* Product items */}
                {menuItems &&
                  Object.entries(menuItems).map(([category, products]) => (
                    <div
                      key={category}
                      className={`modal-category-items ${
                        activeCategory === category ? "active" : ""
                      }`}
                    >
                      {products.map((product) => {
                        // Check if product is not archived
                        if (!product.is_archived) {
                          return (
                            <div
                              key={product.product_id}
                              className="modal-item"
                              onClick={() =>
                                addAdditionalItem(product.product_id)
                              }
                            >
                              {product.product_name}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditReservationModal;
