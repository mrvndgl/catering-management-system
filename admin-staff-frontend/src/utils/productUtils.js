import Swal from "sweetalert2";

// Utility functions for product operations that can be used directly in any component

export const deleteProduct = async (product_id, refreshCallback = null) => {
  try {
    const token = localStorage.getItem("token");
    const result = await Swal.fire({
      title: "Delete Product",
      text: "Are you sure you want to delete this product? This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      const response = await fetch(
        `http://localhost:4000/api/products/${product_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Delete response:", data);

      // Dispatch consistent events for all components
      window.dispatchEvent(new Event("productUpdate"));
      window.dispatchEvent(
        new CustomEvent("menuUpdate", {
          detail: { type: "delete", productId: product_id },
        })
      );

      // Also dispatch a custom event specific for deletion
      window.dispatchEvent(
        new CustomEvent("productDelete", {
          detail: { productId: product_id },
        })
      );

      // Call the refresh callback if provided
      if (refreshCallback) refreshCallback();

      Swal.fire("Deleted!", "The product has been deleted.", "success");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting product:", error);
    Swal.fire("Error!", "Failed to delete product", "error");
    return false;
  }
};

export const archiveProduct = async (product_id, refreshCallback = null) => {
  try {
    const token = localStorage.getItem("token");
    const result = await Swal.fire({
      title: "Archive Product",
      text: "Are you sure you want to archive this product?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FBC02D",
      cancelButtonColor: "#ffffff",
      confirmButtonText: "Yes, archive it!",
      cancelButtonText: "Cancel",
      customClass: {
        cancelButton: "swal2-cancel-custom",
      },
      didOpen: () => {
        const cancelBtn = document.querySelector(".swal2-cancel-custom");
        if (cancelBtn) {
          cancelBtn.style.border = "2px solid #FBC02D";
          cancelBtn.style.color = "#FBC02D";

          cancelBtn.onmouseover = () => {
            cancelBtn.style.backgroundColor = "#FBC02D";
            cancelBtn.style.color = "#fff";
          };

          cancelBtn.onmouseout = () => {
            cancelBtn.style.backgroundColor = "#ffffff";
            cancelBtn.style.color = "#FBC02D";
          };
        }
      },
    });

    if (result.isConfirmed) {
      const response = await fetch(
        `http://localhost:4000/api/products/${product_id}/archive`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Archive response:", data);

      // Dispatch both events for consistent updating across components
      window.dispatchEvent(new Event("productUpdate"));
      window.dispatchEvent(
        new CustomEvent("archiveUpdate", {
          detail: { productId: product_id, archived: true },
        })
      );
      window.dispatchEvent(
        new CustomEvent("menuUpdate", {
          detail: { type: "archive", productId: product_id },
        })
      );

      // Call the refresh callback if provided
      if (refreshCallback) refreshCallback();

      Swal.fire("Archived!", "The product has been archived.", "success");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error archiving product:", error);
    Swal.fire("Error!", "Failed to archive product", "error");
    return false;
  }
};

export const unarchiveProduct = async (product_id, refreshCallback = null) => {
  try {
    const token = localStorage.getItem("token");
    const result = await Swal.fire({
      title: "Unarchive Product",
      text: "Are you sure you want to unarchive this product?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, unarchive it!",
    });

    if (result.isConfirmed) {
      const response = await fetch(
        `http://localhost:4000/api/products/${product_id}/unarchive`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Unarchive response:", data);

      // Dispatch both events for consistent updating across components
      window.dispatchEvent(new Event("productUpdate"));
      window.dispatchEvent(
        new CustomEvent("archiveUpdate", {
          detail: { productId: product_id, archived: false },
        })
      );
      window.dispatchEvent(
        new CustomEvent("menuUpdate", {
          detail: { type: "unarchive", productId: product_id },
        })
      );

      // Call the refresh callback if provided
      if (refreshCallback) refreshCallback();

      Swal.fire("Unarchived!", "The product has been unarchived.", "success");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error unarchiving product:", error);
    Swal.fire("Error!", "Failed to unarchive product", "error");
    return false;
  }
};
