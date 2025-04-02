import Settings from "../models/Settings.js";

export const getPricingSettings = async (req, res) => {
  try {
    console.log("Fetching pricing settings..."); // Debugging

    const pricingSettings = await Settings.findOne({ type: "pricing" });

    if (!pricingSettings) {
      console.log("Pricing settings not found"); // Debugging
      return res.status(404).json({ message: "Pricing settings not found" });
    }

    console.log("Fetched settings:", pricingSettings.data); // Debugging
    res.status(200).json(pricingSettings.data);
  } catch (error) {
    console.error("Error fetching pricing settings:", error);
    res.status(500).json({
      message: "Error fetching pricing settings",
      error: error.message,
    });
  }
};

export const updatePricingSettings = async (req, res) => {
  try {
    const { basePax, pricePerHead, additionalItemPrice } = req.body;

    // Validate required fields
    if (!basePax || !pricePerHead || !additionalItemPrice) {
      return res.status(400).json({
        message: "All pricing settings are required",
      });
    }

    // Convert values to numbers and validate
    const numericBasePax = Number(basePax);
    const numericPricePerHead = Number(pricePerHead);
    const numericAdditionalItemPrice = Number(additionalItemPrice);

    if (isNaN(numericBasePax) || numericBasePax <= 0) {
      return res
        .status(400)
        .json({ message: "Base PAX must be a positive number" });
    }

    if (isNaN(numericPricePerHead) || numericPricePerHead <= 0) {
      return res
        .status(400)
        .json({ message: "Price per head must be a positive number" });
    }

    if (isNaN(numericAdditionalItemPrice) || numericAdditionalItemPrice <= 0) {
      return res
        .status(400)
        .json({ message: "Additional item price must be a positive number" });
    }

    // Update or create settings
    const updatedSettings = await Settings.findOneAndUpdate(
      { type: "pricing" },
      {
        type: "pricing",
        data: {
          basePax: numericBasePax,
          pricePerHead: numericPricePerHead,
          additionalItemPrice: numericAdditionalItemPrice,
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Pricing settings updated successfully",
      settings: updatedSettings.data,
    });
  } catch (error) {
    console.error("Error updating pricing settings:", error);
    res.status(500).json({
      message: "Error updating pricing settings",
      error: error.message,
    });
  }
};
