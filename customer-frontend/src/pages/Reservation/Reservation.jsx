import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import "./Reservation.css";
import { Beef, Drumstick, Fish, Salad, Soup, Utensils } from "lucide-react";
import { fetchMenuItemsByCategory } from "../../api/apiService";
import Swal from "sweetalert2";
import EditReservationModal from "../../components/modals/EditReservationModal";

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

// Add this near your other useEffect hooks or state declarations
const calculateMinDate = () => {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 7);

  const year = minDate.getFullYear();
  const month = String(minDate.getMonth() + 1).padStart(2, "0");
  const day = String(minDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const minDateStr = calculateMinDate();

const Reservation = () => {
  const [formData, setFormData] = useState({
    numberOfPax: 50, // Minimum allowed value
    timeSlot: "",
    paymentMode: "cash",
    reservation_date: minDateStr,
    venue: {
      municipality: "",
      streetAddress: "",
      barangay: "",
      lotNumber: "",
      blockNumber: "",
      landmark: "",
      postalCode: "",
      additionalInfo: "",
    },
    selectedProducts: {},
    specialNotes: "",
  });

  // Menu and product data
  const { foodList, refreshFoodItems } = useContext(StoreContext);
  const [menuItems, setMenuItems] = useState({});
  const [menuItemOrganized, setMenuItemOrganized] = useState([]);
  const [reservations, setReservations] = useState([]);
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
  const [isLoading, setIsLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  // History data
  const [reservationHistory, setReservationHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("create");

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalItemCategory, setAdditionalItemCategory] = useState(
    Object.keys(menuItems).length > 0 ? Object.keys(menuItems)[0] : ""
  );
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

  // Add this handler for venue fields
  const handleVenueChange = (e) => {
    const { name, value } = e.target;
    // Extract the field name after "venue."
    const fieldName = name.split(".")[1];

    setFormData((prevData) => ({
      ...prevData,
      venue: {
        ...prevData.venue,
        [fieldName]: value,
      },
    }));
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await fetch("/api/users/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            // Update to store contactNumber instead of phoneNumber
            setUserInfo({
              name: userData.name,
              phoneNumber: userData.contactNumber, // Change to match your API response field name
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);
  useEffect(() => {
    if (foodList && foodList.length > 0) {
      organizeMenuItems();
    }
  }, [foodList]);

  const organizeMenuItems = async () => {
    try {
      console.log("[Reservation] Organizing menu items from foodList");
      if (!foodList || foodList.length === 0) {
        console.warn("[Reservation] Food list is empty or unavailable");
        return;
      }

      // Get categories or use the existing ones
      let categoriesData = categories;
      if (!categoriesData || categoriesData.length === 0) {
        try {
          const token = localStorage.getItem("token");
          const categoriesResponse = await fetch(
            "http://localhost:4000/api/categories",
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!categoriesResponse.ok) {
            throw new Error(
              `Failed to fetch categories: ${categoriesResponse.status}`
            );
          }

          categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        } catch (error) {
          console.error("[Reservation] Error fetching categories:", error);
          categoriesData = predefinedCategories;
        }
      }

      // Filter out archived items from foodList
      const nonArchivedFoodItems = foodList.filter((item) => !item.archived);
      console.log(
        "[Reservation] Non-archived food items:",
        nonArchivedFoodItems.length
      );

      // Organize by category
      const organizedMenu = {};
      categoriesData.forEach((category) => {
        organizedMenu[category.category_name] = [];
      });

      nonArchivedFoodItems.forEach((item) => {
        const categoryName = categoriesData.find(
          (cat) => cat.category_id === item.category_id
        )?.category_name;

        if (categoryName && organizedMenu[categoryName]) {
          // Transform to expected format
          organizedMenu[categoryName].push({
            product_id: item._id,
            product_name: item.name,
            product_details: item.description,
            category_id: item.category_id,
            images: item.images || [],
          });
        }
      });

      console.log(
        "[Reservation] Organized menu items:",
        Object.keys(organizedMenu).map(
          (key) => `${key}: ${organizedMenu[key].length} items`
        )
      );

      // Set menu items
      setMenuItems(organizedMenu);
      // Set initial active category if needed
      if (Object.keys(organizedMenu).length > 0 && !activeCategory) {
        setActiveCategory(Object.keys(organizedMenu)[0]);
      }

      // Build product lookup for easy reference
      const lookup = {};
      nonArchivedFoodItems.forEach((item) => {
        lookup[item._id] = {
          product_id: item._id,
          product_name: item.name,
          product_details: item.description,
          category_id: item.category_id,
        };
      });
      setProductsLookup(lookup);

      setError("");
    } catch (error) {
      console.error("[Reservation] Error organizing menu items:", error);
      setError(`Failed to organize menu items: ${error.message}`);
    }
  };

  // You can manually refresh if needed
  const handleRefresh = () => {
    refreshFoodItems();
  };

  // Updated getProductName function
  const getProductName = (productId) => {
    // Check if the product exists in the lookup
    const product = productsLookup[productId];
    return product ? product.product_name : "Unknown Product";
  };

  // Updated renderSelectedProducts function
  const renderSelectedProducts = (reservation) => {
    if (!reservation.selectedProducts) return null;

    return Object.entries(reservation.selectedProducts).map(
      ([category, productId]) => {
        return (
          <div key={category} className="menu-item">
            <strong>{category}:</strong> {getProductName(productId)}
          </div>
        );
      }
    );
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
    setLoading(true);
    setError("");

    try {
      console.log("[Reservation] Fetching all product data");
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found - please log in");
        return;
      }

      // Common headers for all requests
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch categories
      console.log("[Reservation] Fetching categories");
      const categoriesResponse = await fetch(
        "http://localhost:4000/api/categories",
        { headers }
      );

      if (!categoriesResponse.ok) {
        throw new Error(
          `Categories request failed: ${categoriesResponse.status}`
        );
      }

      const categoriesData = await categoriesResponse.json();
      console.log("[Reservation] Categories fetched:", categoriesData.length);
      setCategories(categoriesData);

      // Fetch products
      console.log("[Reservation] Fetching products");
      const productsResponse = await fetch(
        "http://localhost:4000/api/products",
        { headers }
      );

      if (!productsResponse.ok) {
        throw new Error(`Products request failed: ${productsResponse.status}`);
      }

      const productsData = await productsResponse.json();
      console.log("[Reservation] Products fetched:", productsData.length);

      // Fetch archived products
      console.log("[Reservation] Fetching archived products");
      const archivedResponse = await fetch(
        "http://localhost:4000/api/products/archived",
        { headers }
      );

      if (!archivedResponse.ok) {
        throw new Error(
          `Archived products request failed: ${archivedResponse.status}`
        );
      }

      const archivedData = await archivedResponse.json();
      console.log(
        "[Reservation] Archived products fetched:",
        archivedData.length
      );
      setArchivedProducts(archivedData);

      // Create a lookup of archived product IDs for faster checks
      const archivedIds = new Set(archivedData.map((item) => item.product_id));

      // Filter out archived products
      const nonArchivedProducts = productsData.filter(
        (product) => !archivedIds.has(product.product_id)
      );
      console.log(
        "[Reservation] Non-archived products:",
        nonArchivedProducts.length
      );

      // Organize by category
      const organizedMenu = {};
      const MenuOrganized = [];
      categoriesData.map((category) => {
        MenuOrganized.push({
          ...category,
          items: [],
        });
      });
      categoriesData.forEach((category) => {
        organizedMenu[category.category_name] = [];
      });
      const groupedByCategory = nonArchivedProducts.reduce((acc, product) => {
        const categoryId = product.category_id;
        if (!acc[categoryId]) {
          acc[categoryId] = [];
        }
        acc[categoryId].push(product);
        return acc;
      }, {});

      MenuOrganized.map((m_o) => {
        m_o.items = groupedByCategory[m_o.category_id];
      });

      setMenuItemOrganized(MenuOrganized);

      nonArchivedProducts.forEach((product) => {
        console.log("nonArchivedProducts", product);
        const categoryName = categoriesData.find(
          (cat) => cat.category_id === product.category_id
        )?.category_name;

        if (categoryName && organizedMenu[categoryName]) {
          organizedMenu[categoryName].push(product);
        }
      });

      console.log("organizedMenu", organizedMenu);
      // Set menu items
      console.log("[Reservation] Setting organized menu items");
      setMenuItems(organizedMenu);

      // Set initial active category if needed
      if (Object.keys(organizedMenu).length > 0 && !activeCategory) {
        setActiveCategory(Object.keys(organizedMenu)[0]);
      }

      // Build product lookup for easy reference
      const lookup = {};
      nonArchivedProducts.forEach((product) => {
        lookup[product.product_id] = product;
      });
      setProductsLookup(lookup);

      console.log("[Reservation] Product data fetch complete");
    } catch (error) {
      console.error("[Reservation] Error fetching product data:", error);
      setError(`Failed to fetch products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (foodList && foodList.length > 0) {
      console.log(
        "[Reservation] foodList updated from context, reorganizing menu items"
      );
      organizeMenuItems();
    }
  }, [foodList]);

  useEffect(() => {
    console.log("[Reservation] Component mounted, fetching initial data");
    fetchAllProductData();

    // Set up event listeners for product updates
    const handleProductUpdate = (event) => {
      console.log(
        "[Reservation] Product update event received:",
        event.detail ? JSON.stringify(event.detail) : "No details"
      );
      fetchAllProductData();
    };

    const handleProductDelete = (event) => {
      console.log(
        "[Reservation] Product delete event received:",
        event.detail ? JSON.stringify(event.detail) : "No details"
      );
      fetchAllProductData();
    };
  }, []);

  // Function to handle editing a reservation
  const handleEditReservation = (reservation) => {
    setSelectedReservation(reservation);
    setEditModalOpen(true);
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem("token");

      // If no token is found, handle the case
      if (!token) {
        console.warn("No authentication token found. User may need to log in.");
        setError("Authentication required. Please log in.");
        // Optionally redirect to login
        // window.location.href = "/login";
        return;
      }

      // Common headers for both requests
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch products with error handling
      let products = [];
      try {
        const productsResponse = await fetch(
          "http://localhost:4000/api/products",
          { headers }
        );

        if (productsResponse.status === 401) {
          console.error("Token expired or invalid. Redirecting to login.");
          // Clear the invalid token
          localStorage.removeItem("token");
          setError("Your session has expired. Please log in again.");
          // Redirect to login
          // window.location.href = "/login";
          return;
        }

        if (!productsResponse.ok) {
          throw new Error(
            `Failed to fetch products: ${productsResponse.status}`
          );
        }

        products = await productsResponse.json();
        console.log("Products fetched successfully:", products);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to load menu items");
        return;
      }

      // Fetch categories with error handling
      let categories = [];
      try {
        const categoriesResponse = await fetch(
          "http://localhost:4000/api/categories",
          { headers }
        );

        if (!categoriesResponse.ok) {
          throw new Error(
            `Failed to fetch categories: ${categoriesResponse.status}`
          );
        }

        categories = await categoriesResponse.json();
        console.log("Categories fetched successfully:", categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Failed to load menu categories");
        return;
      }

      // Organize products by category
      const organizedMenu = {};
      categories.forEach((category) => {
        const categoryProducts = products.filter(
          (product) =>
            product.category_id === category.category_id && !product.archived
        );

        if (categoryProducts.length > 0) {
          organizedMenu[category.category_name] = categoryProducts;
          console.log(
            `Added ${categoryProducts.length} products to ${category.category_name} category`
          );
        }
      });

      console.log("Final organized menu:", organizedMenu);
      setMenuItems(organizedMenu);

      // Check if we have any menu items and set the active category
      const categoryNames = Object.keys(organizedMenu);
      if (categoryNames.length > 0) {
        setActiveCategory(
          (prevActiveCategory) => prevActiveCategory || categoryNames[0]
        );
      }
    } catch (error) {
      console.error("Unexpected error in fetchMenuItems:", error);
      setError("Failed to load menu items");
    }
  };

  // Function to save edited reservation
  const handleSaveEditedReservation = async (updatedReservation) => {
    setIsEditSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        Swal.fire({
          icon: "warning",
          title: "Authentication Required",
          text: "Please log in to update your reservation",
          confirmButtonColor: "#3085d6",
        });
        setEditModalOpen(false);
        return;
      }

      const calculatedTotal = calculateTotal();

      // Format data to match backend expectations - include ALL fields we want to update
      const formattedData = {
        // Use specific field names to avoid confusion
        numberOfPax:
          updatedReservation.numberOfPax || updatedReservation.number_of_guests,
        timeSlot:
          updatedReservation.timeSlot || updatedReservation.reservation_time,
        specialNotes:
          updatedReservation.specialNotes ||
          updatedReservation.special_requests,
        reservation_date: updatedReservation.reservation_date,
        selectedProducts: updatedReservation.selectedProducts || {},
        total_amount: updatedReservation.total_amount,
      };

      console.log("Sending update with data:", formattedData);

      // Use the specific edit endpoint
      const response = await fetch(
        `/api/reservations/edit/${updatedReservation.reservation_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formattedData),
        }
      );

      const data = await response.json();
      console.log("API response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to update reservation");
      }

      // Force a refresh of the reservation data
      await fetchReservationData();

      // Update the reservation in the local state with the returned data
      setReservationHistory((prevHistory) =>
        prevHistory.map((res) =>
          res.reservation_id === updatedReservation.reservation_id
            ? { ...res, ...data.data }
            : res
        )
      );

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Reservation updated successfully!",
        confirmButtonColor: "#3085d6",
      });

      setEditModalOpen(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error("Update error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.message || "An unexpected error occurred. Please try again.",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Add this function to force a fresh fetch of data
  const fetchReservationData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const response = await fetch("/api/reservations/my-reservations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch updated reservation data");
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setReservationHistory(data.data);
        return data.data;
      }
    } catch (error) {
      console.error("Error fetching updated reservation data:", error);
    }

    return null;
  };

  useEffect(() => {
    if (menuItems) {
      const lookup = {};
      Object.values(menuItems).forEach((categoryProducts) => {
        categoryProducts.forEach((product) => {
          lookup[product.product_id] = product;
        });
      });
      setProductsLookup(lookup);
    }
  }, [menuItems]);

  useEffect(() => {
    fetchAllProductData();
  }, []);

  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch("/api/reservations/my-reservations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const data = await response.json();

        if (response.ok) {
          // We need to fetch user info for each reservation
          const reservationsWithUserData = await Promise.all(
            data.data.map(async (reservation) => {
              // Fetch user info for the customer_id
              try {
                const userResponse = await fetch(
                  `/api/users/${reservation.customer_id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  const customer = userData.data;

                  return {
                    ...reservation,
                    userName: `${customer.firstName} ${customer.lastName}`,
                    userPhoneNumber: customer.contactNumber,
                  };
                }

                return reservation; // Return original if fetch fails
              } catch (error) {
                console.error(
                  "Error fetching user data for reservation:",
                  error
                );
                return reservation;
              }
            })
          );

          setReservations(reservationsWithUserData);
        } else {
          setError(data.message || "Failed to fetch reservations");
        }
      } catch (error) {
        console.error("Error fetching reservations:", error);
        setError("An error occurred while fetching reservations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [navigate]);

  const fetchReservationHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setHistoryLoading(false);
        setError("Authentication required. Please log in."); // Provide user feedback
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
        // Handle specific error codes
        if (response.status === 401) {
          setError("Authentication failed. Please log in again.");
          // Optionally redirect to login page
        } else {
          throw new Error("Failed to fetch reservation history");
        }
        return;
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

    // For any fields that are part of the venue object, use the venue handler
    if (name.startsWith("venue.")) {
      handleVenueChange(e);
      return;
    }

    // Handle other fields normally
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));

    // Additional validation or calculations can be added here
    if (name === "numberOfPax") {
      // Recalculate total, etc.
      calculateTotal(parseInt(value) || 0);
    }
  };

  // Handle product selection for main categories
  const handleProductSelect = (category, product) => {
    setFormData((prev) => ({
      ...prev,
      selectedProducts: {
        ...prev.selectedProducts,
        [category]: product.product_id,
      },
    }));
  };

  // Handle additional item selection in modal
  const handleAdditionalItemSelect = (productId) => {
    setSelectedAdditionalItems((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Remove an additional item
  const removeAdditionalItem = (index) => {
    setSelectedAdditionalItems((prev) => {
      const newItems = [...prev];
      newItems.splice(index, 1);
      return newItems;
    });
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

  // Simplified handleSubmit function that doesn't need to send name or phone number
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Note: We're not checking name or phone number anymore since they're fetched from the backend
    if (!formData.numberOfPax || !formData.timeSlot) {
      Swal.fire({
        icon: "error",
        title: "Required Fields Missing",
        text: "Please fill in all required fields",
        confirmButtonColor: "#3085d6",
      });
      setIsSubmitting(false);
      return;
    }

    // Validate venue details
    if (
      !formData.venue.municipality ||
      !formData.venue.barangay ||
      !formData.venue.streetAddress
    ) {
      Swal.fire({
        icon: "error",
        title: "Venue Information Incomplete",
        text: "Please provide municipality, barangay, and street address for the venue",
        confirmButtonColor: "#3085d6",
      });
      setIsSubmitting(false);
      return;
    }

    // Validate street address length
    if (formData.venue.streetAddress.length < 5) {
      Swal.fire({
        icon: "error",
        title: "Invalid Street Address",
        text: "Street address must be at least 5 characters long",
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

    // Validate min/max pax
    if (formData.numberOfPax < 50 || formData.numberOfPax > 150) {
      Swal.fire({
        icon: "error",
        title: "Invalid Number of Pax",
        text: "Number of guests must be between 50 and 150",
        confirmButtonColor: "#3085d6",
      });
      setIsSubmitting(false);
      return;
    }

    // Validate date is at least 7 days in advance
    const selectedDate = new Date(formData.reservation_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minAllowedDate = new Date(today);
    minAllowedDate.setDate(today.getDate() + 7);

    if (selectedDate < minAllowedDate) {
      Swal.fire({
        icon: "error",
        title: "Invalid Date",
        text: "Reservations must be made at least 7 days in advance.",
        confirmButtonColor: "#3085d6",
      });
      setIsSubmitting(false);
      return;
    }

    const reservationData = {
      numberOfPax: formData.numberOfPax,
      timeSlot: formData.timeSlot,
      paymentMode: formData.paymentMode,
      reservation_date: formData.reservation_date,
      venue: formData.venue,
      selectedProducts: formData.selectedProducts,
      additionalItems: selectedAdditionalItems,
      specialNotes: formData.specialNotes,
      totalAmount: totalAmount,
      // No need to include phoneNumber or name as they'll be fetched from user details on the backend
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
    if (!formData.numberOfPax) return 0;

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

    const total = basePriceForPax + additionalItemsTotal;
    setTotalAmount(total);
    return total;
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

  // Load menu items and pricing settings
  useEffect(() => {
    const loadData = async () => {
      try {
        const menuData = await fetchMenuItemsByCategory(false); // false = don't include archived items
        const pricingData = await fetchPricingSettings();

        // Set the menu items
        setMenuItems(menuData);

        // Set default active category if we have categories
        if (Object.keys(menuData).length > 0) {
          setActiveCategory(Object.keys(menuData)[0]);
          setAdditionalItemCategory(Object.keys(menuData)[0]);
        }

        // Set pricing settings
        setPricingSettings(pricingData);
      } catch (error) {
        console.error("Error loading reservation data:", error);
        // Handle error appropriately
      }
    };

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

  // Find a product by ID from all available products
  const findProductById = (productId) => {
    for (const category in menuItems) {
      const product = menuItems[category].find(
        (p) => p.product_id === productId
      );
      if (product) return product;
    }
    return null;
  };
  // render reservation history
  const renderReservationCard = (reservation) => {
    return (
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
            <strong>Name:</strong> {reservation.userName || "Not available"}
          </p>
          <p>
            <strong>Phone Number:</strong>{" "}
            {reservation.userPhoneNumber || "Not available"}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {new Date(reservation.reservation_date).toLocaleDateString()}
          </p>
          <p>
            <strong>Time Slot:</strong> {reservation.timeSlot}
          </p>
          <div className="venue-details">
            <strong>Venue:</strong>
            {typeof reservation.venue === "object" ? (
              <div className="venue-address">
                {reservation.venue.streetAddress}
                {reservation.venue.lotNumber &&
                  `, Lot ${reservation.venue.lotNumber}`}
                {reservation.venue.blockNumber &&
                  `, Block ${reservation.venue.blockNumber}`}
                <br />
                Brgy. {reservation.venue.barangay},{" "}
                {reservation.venue.municipality}, Bohol
                {reservation.venue.postalCode &&
                  ` ${reservation.venue.postalCode}`}
                {reservation.venue.landmark && (
                  <>
                    <br />
                    <span className="landmark">
                      Landmark: {reservation.venue.landmark}
                    </span>
                  </>
                )}
                {reservation.venue.additionalInfo && (
                  <div className="additional-venue-info">
                    <em>Additional Info: {reservation.venue.additionalInfo}</em>
                  </div>
                )}
              </div>
            ) : (
              <span>{reservation.venue}</span> // Fallback for older reservations with string venue
            )}
          </div>
          <p>
            <strong>Number of Pax:</strong> {reservation.numberOfPax}
          </p>
          <p>
            <strong>Payment Mode:</strong> {reservation.paymentMode}
          </p>

          <div className="menu-section">
            <div className="selected-items">
              {reservation.selectedProducts &&
                Object.keys(reservation.selectedProducts).length > 0 && (
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
                    {reservation.additionalItems.map((itemId, index) => (
                      <div key={index} className="menu-item">
                        {getProductName(itemId)}
                      </div>
                    ))}
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

          {reservation.reservation_status.toLowerCase() === "pending" && (
            <div className="reservation-actions">
              <button
                className="edit-button"
                onClick={() => handleEditReservation(reservation)}
              >
                Edit Reservation
              </button>
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
                      handleCancelReservation(reservation.reservation_id);
                    }
                  });
                }}
              >
                Cancel Reservation
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

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
                {/* Phone number and name are now fetched from the user model */}
                <div className="form-group">
                  <label>Number of Pax:</label>
                  <input
                    type="number"
                    name="numberOfPax"
                    min={50}
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
                    min={minDateStr} // Use minimum date (7 days from today)
                    required
                  />
                  <small className="date-info">
                    Reservations must be made at least 7 days in advance.
                  </small>
                </div>

                <div className="form-group venue-container">
                  <h4>Venue Details</h4>

                  <div className="venue-field">
                    <label>Municipality:</label>
                    <select
                      name="venue.municipality"
                      value={formData.venue?.municipality || ""}
                      onChange={handleVenueChange}
                      required
                    >
                      <option value="">Select municipality (Bohol)</option>
                      <option value="Tagbilaran">Tagbilaran</option>
                      <option value="Dauis">Dauis</option>
                      <option value="Baclayon">Baclayon</option>
                      <option value="Albur">Albur</option>
                      <option value="Maribojoc">Maribojoc</option>
                      <option value="Corella">Corella</option>
                    </select>
                  </div>

                  <div className="venue-field">
                    <label>Barangay:</label>
                    <input
                      type="text"
                      name="venue.barangay"
                      value={formData.venue?.barangay || ""}
                      onChange={handleVenueChange}
                      placeholder="Enter barangay name"
                      required
                    />
                  </div>

                  <div className="venue-field">
                    <label>Street Address:</label>
                    <input
                      type="text"
                      name="venue.streetAddress"
                      value={formData.venue?.streetAddress || ""}
                      onChange={handleVenueChange}
                      placeholder="Enter street name/number"
                      required
                    />
                  </div>

                  <div className="venue-field-row">
                    <div className="venue-field half">
                      <label>Lot Number:</label>
                      <input
                        type="text"
                        name="venue.lotNumber"
                        value={formData.venue?.lotNumber || ""}
                        onChange={handleVenueChange}
                        placeholder="Lot #"
                      />
                    </div>

                    <div className="venue-field half">
                      <label>Block Number:</label>
                      <input
                        type="text"
                        name="venue.blockNumber"
                        value={formData.venue?.blockNumber || ""}
                        onChange={handleVenueChange}
                        placeholder="Block #"
                      />
                    </div>
                  </div>

                  <div className="venue-field">
                    <label>Nearest Landmark:</label>
                    <input
                      type="text"
                      name="venue.landmark"
                      value={formData.venue?.landmark || ""}
                      onChange={handleVenueChange}
                      placeholder="E.g., Near St. Joseph Cathedral"
                    />
                  </div>

                  <div className="venue-field">
                    <label>Postal Code:</label>
                    <input
                      type="text"
                      name="venue.postalCode"
                      value={formData.venue?.postalCode || ""}
                      onChange={handleVenueChange}
                      placeholder="Enter postal code"
                    />
                  </div>

                  <div className="venue-field">
                    <label>Additional Information:</label>
                    <textarea
                      name="venue.additionalInfo"
                      value={formData.venue?.additionalInfo || ""}
                      onChange={handleVenueChange}
                      placeholder="Any additional venue details..."
                      rows={2}
                    />
                  </div>

                  {formData.venue?.municipality &&
                    formData.venue?.barangay &&
                    formData.venue?.streetAddress && (
                      <div className="venue-summary">
                        <h5>Venue Summary:</h5>
                        <p className="venue-preview">
                          {formData.venue.streetAddress}
                          {formData.venue.lotNumber &&
                            `, Lot ${formData.venue.lotNumber}`}
                          {formData.venue.blockNumber &&
                            `, Block ${formData.venue.blockNumber}`}
                          ,
                          <br />
                          Brgy. {formData.venue.barangay},{" "}
                          {formData.venue.municipality}, Bohol
                          {formData.venue.postalCode &&
                            ` ${formData.venue.postalCode}`}
                          {formData.venue.landmark && (
                            <>
                              <br />
                              Landmark: {formData.venue.landmark}
                            </>
                          )}
                        </p>
                      </div>
                    )}
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

            {/* Enhanced Menu Selection Component with Images */}
            <div className="menu-selection form-section">
              <h3 className="section-title">Select Menu Items</h3>
              {/* Category tabs */}
              <div className="category-tabs">
                {menuItemOrganized.map((category) => (
                  <div
                    key={category?.category_id}
                    className={`category-tab ${
                      activeCategory === category?.category_name ? "active" : ""
                    }`}
                    onClick={() => setActiveCategory(category?.category_name)}
                  >
                    <div className="icon-container">
                      {getCategoryIcon(category?.category_name)}
                    </div>
                    <span>{category?.category_name}</span>
                  </div>
                ))}
              </div>
              {console.log(
                "formData.selectedProducts",
                formData.selectedProducts
              )}
              {/* Display products for each category */}
              {menuItemOrganized.map((category) => {
                return (
                  <div
                    // key={`category-tab-${category}`}
                    className={`category-section ${
                      activeCategory === category?.category_name ? "active" : ""
                    }`}
                  >
                    <div className="product-list">
                      {category?.items?.map((product) => (
                        <div
                          key={product.product_id}
                          className={`product-item ${
                            formData.selectedProducts[
                              category?.category_name
                            ] === product.product_id
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            handleProductSelect(
                              category?.category_name,
                              product
                            )
                          }
                        >
                          {console.log(
                            "productproductproductproductzzz",
                            product
                          )}
                          {/* Product Image Display */}
                          <div className="product-image">
                            <img
                              src={
                                "http://localhost:4000" + product?.primary_image
                              }
                              alt={product?.product_name}
                            />
                          </div>
                          <div className="product-content">
                            <input
                              type="radio"
                              name={`product-${category?.category_name}`}
                              checked={
                                formData.selectedProducts[
                                  category?.category_name
                                ] === product.product_id
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
                );
              })}
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
                      {/* Additional item image */}
                      {item.images && item.images.length > 0 && (
                        <div className="additional-item-image">
                          <img
                            src={
                              item.images.find((img) => img.is_primary)?.url ||
                              item.images[0].url
                            }
                            alt={item.product_name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/images/placeholder-food.png";
                            }}
                          />
                        </div>
                      )}
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

            {/* Additional Item Modal */}
            {showAdditionalItemModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h3>Select Additional Items</h3>
                    <button
                      className="close-modal"
                      onClick={() => setShowAdditionalItemModal(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="modal-body">
                    {/* Category tabs for additional items */}
                    <div className="category-tabs">
                      {Object.keys(menuItems).map((category) => (
                        <div
                          key={category}
                          className={`category-tab ${
                            additionalItemCategory === category ? "active" : ""
                          }`}
                          onClick={() => setAdditionalItemCategory(category)}
                        >
                          <div className="icon-container">
                            {getCategoryIcon(category)}
                          </div>
                          <span>{category}</span>
                        </div>
                      ))}
                    </div>

                    {/* Display products for each category in modal */}
                    {Object.entries(menuItems).map(([category, products]) => (
                      <div
                        key={category}
                        className={`category-section ${
                          additionalItemCategory === category ? "active" : ""
                        }`}
                      >
                        <div className="additional-product-list">
                          {products.map((product) => (
                            <div
                              key={product.product_id}
                              className={`additional-product-item ${
                                selectedAdditionalItems.includes(
                                  product.product_id
                                )
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() =>
                                handleAdditionalItemSelect(product.product_id)
                              }
                            >
                              {/* Product Image in modal */}
                              <div className="additional-product-image">
                                {product.images && product.images.length > 0 ? (
                                  <img
                                    src={
                                      product.images.find(
                                        (img) => img.is_primary
                                      )?.url || product.images[0].url
                                    }
                                    alt={product.product_name}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src =
                                        "/images/placeholder-food.png";
                                    }}
                                  />
                                ) : (
                                  <div className="no-image">
                                    <span>No Image</span>
                                  </div>
                                )}
                              </div>
                              <div className="additional-product-content">
                                <input
                                  type="checkbox"
                                  checked={selectedAdditionalItems.includes(
                                    product.product_id
                                  )}
                                  onChange={() => {}}
                                />
                                <span className="additional-product-name">
                                  {product.product_name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn-primary"
                      onClick={() => setShowAdditionalItemModal(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

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
              <div className="modal-overlay">
                <div className="modal-content">
                  {/* Modal Header */}
                  <div className="modal-header">
                    <h3>Select Additional Items</h3>
                    <button
                      type="button"
                      className="close-modal"
                      onClick={() => setShowAdditionalItemModal(false)}
                      aria-label="Close modal"
                    >
                      ×
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="modal-body">
                    {Object.entries(menuItems).map(([category, products]) => (
                      <div key={category} className="modal-category">
                        <div className="category-header">
                          {getCategoryIcon(category)}
                          <h4>{category}</h4>
                        </div>

                        <div className="modal-products">
                          {products.map((product) => (
                            <div
                              key={product.product_id}
                              className={`modal-product-item ${
                                product.is_archived ? "archived-product" : ""
                              }`}
                            >
                              <label>
                                <input
                                  type="radio"
                                  name={`radio-${category}`}
                                  value={product.product_id}
                                  onChange={() => {
                                    addAdditionalItem(product.product_id);
                                    setShowAdditionalItemModal(false);
                                  }}
                                />
                                <span className="product-name">
                                  {product.product_name}
                                </span>
                                {product.is_archived && (
                                  <span className="archived-label">
                                    (Archived)
                                  </span>
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Modal Footer - New */}
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="modal-button cancel-button"
                      onClick={() => setShowAdditionalItemModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="modal-button confirm-button"
                      onClick={() => setShowAdditionalItemModal(false)}
                    >
                      Done
                    </button>
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
                            <label>
                              <input
                                type="radio"
                                name={`radio-${category}`} // ensures only one can be selected per category
                                value={product.product_id}
                                onChange={() =>
                                  addAdditionalItem(product.product_id)
                                }
                              />
                              {product.product_name}
                              {product.is_archived && (
                                <span className="archived-label">
                                  (Archived)
                                </span>
                              )}
                            </label>
                          </div>
                        ))}
                        {products.map((product) => (
                          <div
                            key={product.product_id}
                            className="modal-product-item"
                          >
                            <label>
                              <input
                                type="radio"
                                name={`radio-${category}`}
                                value={product.product_id}
                                onChange={() => {
                                  addAdditionalItem(product.product_id); // your function to handle selection
                                  setShowAdditionalItemModal(false); // close the modal right after
                                }}
                              />
                              {product.product_name}
                              {product.is_archived && (
                                <span className="archived-label">
                                  (Archived)
                                </span>
                              )}
                            </label>
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
        <div className="reservation-history-section">
          {historyLoading ? (
            <div className="loading">Loading reservation history...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : Array.isArray(reservationHistory) &&
            reservationHistory.length > 0 ? (
            reservationHistory.map((reservation) =>
              renderReservationCard(reservation)
            )
          ) : (
            <div className="no-reservations">
              <p>No reservation history found.</p>
            </div>
          )}

          {editModalOpen && selectedReservation && (
            <EditReservationModal
              isOpen={editModalOpen}
              onClose={() => {
                setEditModalOpen(false);
                setSelectedReservation(null);
              }}
              reservation={selectedReservation}
              onSave={handleSaveEditedReservation}
              menuItems={menuItems}
              pricingSettings={pricingSettings}
              availableTimeSlots={availableTimeSlots}
              productsLookup={productsLookup}
              isSubmitting={isEditSubmitting}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Reservation;
