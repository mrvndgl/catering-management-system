import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Reservation.css";
import { Beef, Drumstick, Fish, Salad, Soup, Utensils } from "lucide-react";
import Swal from "sweetalert2";

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

  // Menu and product data
  const [menuItems, setMenuItems] = useState({});
  const [productsLookup, setProductsLookup] = useState({});
  const [categories, setCategories] = useState();
  const [archivedProducts, setArchivedProducts] = useState([
    {
      product_id: 1,
      archived: true,
    },
  ]);

  const [pricingSettings, setPricingSettings] = useState({
    basePax: 50,
    pricePerHead: 350,
    additionalItemPrice: 35,
    basePrice: 17500,
  });
  const [totalAmount, setTotalAmount] = useState(0);

  // UI state
  const [activeCategory, setActiveCategory] = useState(
    Object.keys(MENU_ITEMS)[0]
  );
  const [activeModalCategory, setActiveModalCategory] = useState(
    Object.keys(MENU_ITEMS)[0]
  );
  const [showAdditionalItemModal, setShowAdditionalItemModal] = useState(false);
  const [selectedAdditionalItems, setSelectedAdditionalItems] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  // History data
  const [reservationHistory, setReservationHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("create");

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errorArchived, setErrorArchived] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Predefined data
  const predefinedCategories = [
    { category_id: 1, category_name: "Beef" },
    { category_id: 2, category_name: "Pork" },
    { category_id: 3, category_name: "Chicken" },
    { category_id: 4, category_name: "Seafood" },
    { category_id: 5, category_name: "Noodles" },
    { category_id: 6, category_name: "Vegetables" },
  ];

  const [availableTimeSlots] = useState([
    { id: "Lunch", label: "Lunch (11:00 AM - 12:00 PM)" },
    { id: "Early_Dinner", label: "Early Dinner (4:00 PM - 5:00 PM)" },
    { id: "Dinner", label: "Dinner (5:00 PM - 7:00 PM)" },
  ]);

  // Navigation
  const navigate = useNavigate();

  // Helper functions
  const isArchived = (id) => {
    return archivedProducts.filter((archived) => archived?.product_id == id)
      ? true
      : false;
  };

  const getProductName = (productId) => {
    const id = String(productId); // Ensure it's a string
    return productsLookup[id]?.product_name || "Unknown Product";
  };

  // Find product by ID from all menu items
  const findProductById = (productId) => {
    // Check if the product is archived
    const isArchived = archivedProducts.some(
      (item) => item.product_id === productId && item.archived
    );

    // If archived, don't return it
    if (isArchived) return null;

    // Otherwise, look for it in all categories
    for (const category in MENU_ITEMS) {
      const product = MENU_ITEMS[category].find(
        (p) => p.product_id === productId
      );
      if (product) return product;
    }
    return null;
  };

  //icon for category
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

  // Function to fetch categories from API
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found - please log in");
        setCategories(predefinedCategories);
        return;
      }

      const response = await fetch("http://localhost:4000/api/categories", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(
          `HTTP Error Response: ${response.status} ${response.statusText}`
        );

        if (response.status === 401) {
          // Clear invalid token
          localStorage.removeItem("token");
          throw new Error("Authentication required - please log in");
        }

        if (response.status === 404) {
          throw new Error(
            "Categories endpoint not found - please check API route configuration"
          );
        }

        throw new Error(
          `Failed to fetch categories (Status: ${response.status})`
        );
      }

      const data = await response.json();

      // Keep the original structure from the API
      const formattedCategories = data.map((category) => ({
        category_id: category.category_id,
        category_name: category.category_name,
        category_details: category.category_details,
      }));

      setCategories(
        formattedCategories.length > 0
          ? formattedCategories
          : predefinedCategories
      );
      setError("");
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories(predefinedCategories);
      setError(`Using default categories - ${error.message}`);
    }
  };

  const fetchAllProductData = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch categories
      const categoriesResponse = await fetch(
        "http://localhost:4000/api/categories"
      );
      if (!categoriesResponse.ok)
        throw new Error(`HTTP error! status: ${categoriesResponse.status}`);
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData);

      // Fetch regular products
      const productsResponse = await fetch(
        "http://localhost:4000/api/products",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!productsResponse.ok)
        throw new Error(`HTTP error! status: ${productsResponse.status}`);
      const productsData = await productsResponse.json();

      // Fetch archived products
      const archivedResponse = await fetch(
        "http://localhost:4000/api/products/archived",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!archivedResponse.ok)
        throw new Error(`HTTP error! status: ${archivedResponse.status}`);
      const archivedData = await archivedResponse.json();
      setArchivedProducts(archivedData);

      // Create a lookup of archived product IDs for faster checks
      const archivedIds = new Set(archivedData.map((item) => item.product_id));

      // Filter out archived products
      const nonArchivedProducts = productsData.filter(
        (product) => !archivedIds.has(product.product_id)
      );

      // Organize by category
      const organizedMenu = {};
      categoriesData.forEach((category) => {
        organizedMenu[category.category_name] = [];
      });

      nonArchivedProducts.forEach((product) => {
        const categoryName = categoriesData.find(
          (cat) => cat.category_id === product.category_id
        )?.category_name;

        if (categoryName && organizedMenu[categoryName]) {
          organizedMenu[categoryName].push(product);
        }
      });

      // Set menu items
      setMenuItems(organizedMenu);

      // Set initial active category
      if (categoriesData.length > 0 && !activeCategory) {
        setActiveCategory(categoriesData[0].category_name);
      }

      // Also create lookup for quick reference
      const productsLookup = nonArchivedProducts.reduce((acc, product) => {
        acc[product.product_id] = product;
        return acc;
      }, {});

      setProductsLookup(productsLookup);
    } catch (error) {
      console.error("Error fetching product data:", error);
      setCategories([]);
      setMenuItems({});
      setError("Failed to fetch products");
    }
  };

  useEffect(() => {
    fetchAllProductData();
  }, []);

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

  const fetchPricingSettings = async () => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/settings/pricing",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Pricing settings not found, using defaults.");
          return {
            basePax: 50,
            pricePerHead: 350,
            additionalItemPrice: 35,
            basePrice: 17500,
          };
        }
        throw new Error(`Failed to fetch pricing settings: ${response.status}`);
      }

      const settings = await response.json();
      console.log("Fetched Settings:", settings);

      // Make sure basePrice is calculated correctly if it's not included in the API response
      if (!settings.basePrice && settings.basePax && settings.pricePerHead) {
        settings.basePrice = settings.basePax * settings.pricePerHead;
      }

      return settings;
    } catch (error) {
      console.error("Error fetching pricing settings:", error);
      // Return default values in case of error
      return {
        basePax: 50,
        pricePerHead: 350,
        additionalItemPrice: 35,
        basePrice: 17500,
      };
    }
  };

  // Fetch pricing settings from API
  const fetchPricingData = async () => {
    try {
      const settings = await fetchPricingSettings();
      if (settings) {
        setPricingSettings(settings);
      }
    } catch (error) {
      console.error("Error fetching pricing settings:", error);
      // Keep using default values if there's an error
    }
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

  const handleAdditionalItemSelect = (category, product) => {
    setSelectedAdditionalItems((prev) => [...prev, product.product_id]);
    setShowAdditionalItemModal(false);
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

  // Handle form submission
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
      pricingDetails: {
        basePax: pricingSettings.basePax,
        pricePerHead: pricingSettings.pricePerHead,
        additionalItemPrice: pricingSettings.additionalItemPrice,
      },
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

  const fetchSettingsData = async () => {
    try {
      const pricingData = await fetchPricingSettings();
      setPricingSettings(pricingData);
      return { pricing: pricingData };
    } catch (error) {
      console.error("Error fetching settings data:", error);
      return null;
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // First fetch categories
      await fetchCategories();

      // Call fetchSettingsData
      const settingsData = await fetchSettingsData();
      if (!settingsData) {
        throw new Error("Failed to fetch settings data");
      }

      // Optional: fetch reservation history if needed
      if (activeTab === "history") {
        await fetchReservationHistory();
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Render selected products for a reservation
  const renderSelectedProducts = (reservation) => {
    return Object.entries(reservation.selectedProducts).map(
      ([productId, quantity]) => (
        <div key={productId} className="flex justify-between">
          <span>{getProductName(String(productId))}</span>
          <span>{quantity}</span>
        </div>
      )
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch reservations and products when component mounts
  useEffect(() => {
    fetchReservationHistory();
  }, []);

  useEffect(() => {
    fetchReservationHistory();
  }, [activeTab]);

  useEffect(() => {
    calculateTotal();
  }, [
    formData.numberOfPax,
    formData.selectedProducts,
    selectedAdditionalItems,
    pricingSettings,
  ]);

  // Recalculate total amount when relevant data changes
  useEffect(() => {
    calculateTotal();
  }, [formData.numberOfPax, selectedAdditionalItems, pricingSettings]);

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

  // Create a filtered version of MENU_ITEMS that excludes archived products
  const getFilteredMenuItems = () => {
    const filteredMenu = {};

    Object.entries(MENU_ITEMS).forEach(([category, products]) => {
      // Filter out archived products for this category
      const filteredProducts = products.filter(
        (product) =>
          !archivedProducts.some(
            (archivedItem) =>
              archivedItem.product_id === product.product_id &&
              archivedItem.archived
          )
      );

      // Only add the category if it has products after filtering
      if (filteredProducts.length > 0) {
        filteredMenu[category] = filteredProducts;
      }
    });

    return filteredMenu;
  };

  // In your useEffect or initialization function:
  useEffect(() => {
    // Set the filtered menu items
    setMenuItems(getFilteredMenuItems());
  }, [archivedProducts]);

  useEffect(() => {
    const fetchArchivedProducts = async () => {
      try {
        const data = await getArchivedProducts();
        setArchivedProducts(data);
      } catch (error) {
        console.error("Error fetching archived products:", error);
      }
    };

    fetchArchivedProducts();
  }, []);

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
                    min={pricingSettings.basePax > 0 ? 1 : 50} // Minimum can be based on pricing settings
                    max="150"
                    value={formData.numberOfPax}
                    onChange={handleInputChange}
                    required
                  />
                  <small className="pricing-note">
                    Base price is for {pricingSettings.basePax} guests.
                    Additional guests: ₱{pricingSettings.pricePerHead} per
                    person.
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
                {Object.keys(menuItems).map((category) => (
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
              {Object.entries(menuItems).map(([category, products]) => (
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
                  Additional items: ₱{pricingSettings.additionalItemPrice} per
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
                  .filter((item) => item !== null) // Filter out null items (archived ones)
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
                    Base Package: ₱{pricingSettings.basePrice.toLocaleString()}{" "}
                    for {pricingSettings.basePax} guests
                  </p>
                  <p>
                    Additional Items: ₱{pricingSettings.additionalItemPrice} per
                    person, per item
                  </p>
                </div>

                {formData.numberOfPax &&
                  parseInt(formData.numberOfPax) > pricingSettings.basePax && (
                    <div className="pricing-row">
                      <span>
                        Additional Guests (
                        {parseInt(formData.numberOfPax) -
                          pricingSettings.basePax}{" "}
                        × ₱{pricingSettings.pricePerHead}):
                      </span>
                      <span>
                        ₱
                        {(
                          (parseInt(formData.numberOfPax) -
                            pricingSettings.basePax) *
                          pricingSettings.pricePerHead
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}

                {selectedAdditionalItems.length > 0 && formData.numberOfPax && (
                  <div className="pricing-row">
                    <span>
                      Additional Items ({selectedAdditionalItems.length} items ×{" "}
                      {formData.numberOfPax} guests × ₱
                      {pricingSettings.additionalItemPrice}):
                    </span>
                    <span>
                      ₱
                      {(
                        selectedAdditionalItems.length *
                        parseInt(formData.numberOfPax) *
                        pricingSettings.additionalItemPrice
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

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Reservation..." : "Create Reservation"}
            </button>

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
                      {Object.keys(MENU_ITEMS).map((category) => (
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
                    {Object.entries(MENU_ITEMS).map(([category, products]) => (
                      <div
                        key={category}
                        className={`modal-category-items ${
                          activeCategory === category ? "active" : ""
                        }`}
                      >
                        {}
                        {products.map((product) => {
                          if (!isArchived(product.product_id)) {
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
                          return "";
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Additional Items Modal */}
          {showAdditionalItemModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Select Additional Items</h3>
                  <button
                    type="button"
                    className="close-modal"
                    onClick={() => setShowAdditionalItemModal(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  {Object.entries(menuItems).map(([category, products]) => (
                    <div key={category} className="modal-category">
                      <h4>{category}</h4>
                      <div className="modal-products">
                        {products.map((product) => (
                          <div
                            key={product.product_id}
                            className="modal-product-item"
                            onClick={() =>
                              addAdditionalItem(product.product_id)
                            }
                          >
                            {product.product_name}
                            {product.is_archived && (
                              <span className="archived-label">(Archived)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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

                    <div className="menu-section">
                      <h4>Selected Menu Items</h4>
                      <div className="selected-items">
                        {reservation.selectedProducts &&
                          Object.keys(reservation.selectedProducts).length >
                            0 && (
                            <div className="selected-products">
                              <h4>Selected Products:</h4>
                              {renderSelectedProducts(reservation)}
                            </div>
                          )}

                        <p className="total-amount">
                          <strong>Total Amount:</strong> ₱
                          {reservation.total_amount?.toLocaleString()}
                        </p>
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
