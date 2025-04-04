import React, { useState, useEffect } from "react";
import { Pencil, Archive, Trash2, ArchiveRestore, Users } from "lucide-react";
import "./ViewAccounts.css";
import Swal from "sweetalert2";

const ViewAccounts = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAccount, setNewAccount] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    contactNumber: "",
    address: "",
    password: "",
  });
  const [showArchived, setShowArchived] = useState(false);
  const [archivedAccounts, setArchivedAccounts] = useState([]);

  useEffect(() => {
    if (showArchived) {
      fetchArchivedAccounts();
    } else {
      fetchAccounts();
    }
  }, [showArchived]);

  useEffect(() => {
    if (accounts.length > 0) {
      console.log("Full accounts data:", JSON.stringify(accounts, null, 2));
      console.log("First account properties:", Object.keys(accounts[0]));
    }
  }, [accounts]);

  const fetchArchivedAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authorization token found");
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/employees/staff/archived`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setArchivedAccounts(data);
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: err.message || "Failed to fetch archived accounts",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      setError(err.message);
    }
  };

  const handleArchiveAccount = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Archive Account",
        text: "Are you sure you want to archive this account? The user will no longer be able to access the system.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, archive it!",
      });

      if (!result.isConfirmed) {
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authorization token found");
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/employees/staff/archive/${id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to archive account");
      }

      // Update local states
      setAccounts((prevAccounts) =>
        prevAccounts.filter((account) => account._id !== id)
      );
      setArchivedAccounts((prevArchived) => [...prevArchived, data.employee]);

      // Show success message
      Swal.fire({
        title: "Success!",
        text: "Account archived successfully",
        icon: "success",
        confirmButtonColor: "#28a745",
      });
    } catch (err) {
      console.error("Archive error:", err);
      Swal.fire({
        title: "Error!",
        text: err.message || "Failed to archive account",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      setError(err.message);
    }
  };

  const handleUnarchiveAccount = async (id) => {
    try {
      // Show confirmation dialog
      const result = await Swal.fire({
        title: "Unarchive Account",
        text: "Are you sure you want to unarchive this account? The user will be able to access the system again.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, unarchive it!",
      });

      if (!result.isConfirmed) {
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authorization token found");
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/employees/staff/unarchive/${id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to unarchive account");
      }

      // Update local states
      setArchivedAccounts((prevArchived) =>
        prevArchived.filter((account) => account._id !== id)
      );
      setAccounts((prevAccounts) => [...prevAccounts, data.employee]);

      // Show success message
      Swal.fire({
        title: "Success!",
        text: "Account unarchived successfully",
        icon: "success",
        confirmButtonColor: "#28a745",
      });

      // Refresh both lists
      await fetchArchivedAccounts();
      await fetchAccounts();
    } catch (err) {
      console.error("Unarchive error:", err);
      Swal.fire({
        title: "Error!",
        text: err.message || "Failed to unarchive account",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      setError(err.message);
    }
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authorization token found");
      }

      console.log("Fetching accounts...");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/employees/staff`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("Accounts fetched:", data);

      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized access
          Swal.fire({
            title: "Session Expired",
            text: "Please log in again to continue.",
            icon: "error",
            confirmButtonColor: "#dc3545",
          });
          // Optionally redirect to login page
          window.location.href = "/login";
          return;
        }
        throw new Error(data.message || "Failed to fetch accounts");
      }

      // Validate data structure
      if (Array.isArray(data)) {
        console.log(`Received ${data.length} accounts`);
        setAccounts(data);
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
      Swal.fire({
        title: "Error!",
        text: err.message || "Failed to fetch accounts",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm("Are you sure you want to delete this account?"))
      return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/employees/staff/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      setAccounts(accounts.filter((account) => account._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewAccount((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log("Submitting new account data:", newAccount);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/employees/staff/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newAccount,
          employeeType: "staff",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create account");
      }

      const data = await response.json();
      console.log("Server response:", data);

      // Refresh the account list instead of manually updating state
      await fetchAccounts();

      setNewAccount({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        contactNumber: "",
        address: "",
        password: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = (id) => {
    const accountToEdit = accounts.find((account) => account._id === id);
    console.log("Editing account:", accountToEdit);

    if (!accountToEdit) {
      setError("Failed to find account for editing");
      return;
    }

    setNewAccount({
      firstName: accountToEdit.firstName,
      lastName: accountToEdit.lastName,
      username: accountToEdit.username,
      email: accountToEdit.email,
      contactNumber: accountToEdit.contactNumber,
      address: accountToEdit.address || "",
      password: "", // Leave password blank for security
    });

    // Set editing mode
    setIsEditing(true);
    setEditingId(id);

    // Scroll to form
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Modify your form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const url = isEditing
        ? `/api/employees/staff/${editingId}`
        : "/api/employees/staff/create";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newAccount,
          employeeType: "staff",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to ${isEditing ? "update" : "create"} account`
        );
      }

      // Refresh accounts list
      await fetchAccounts();

      // Reset form
      setNewAccount({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        contactNumber: "",
        address: "",
        password: "",
      });

      // Exit editing mode if editing
      if (isEditing) {
        setIsEditing(false);
        setEditingId(null);
      }

      // Show success message
      alert(`Staff account ${isEditing ? "updated" : "created"} successfully!`);
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setNewAccount({
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      contactNumber: "",
      address: "",
      password: "",
    });
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="accounts-container">
      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="add-account-section">
        <h2>{isEditing ? "Edit Staff Account" : "Add New Staff Account"}</h2>
        <form
          onSubmit={isEditing ? handleSubmit : handleAddAccount}
          className="account-form"
        >
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={newAccount.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={newAccount.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                value={newAccount.username}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={newAccount.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactNumber">Contact Number</label>
              <input
                id="contactNumber"
                type="tel"
                name="contactNumber"
                value={newAccount.contactNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                type="text"
                name="address"
                value={newAccount.address}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={newAccount.password}
                onChange={handleInputChange}
                placeholder={
                  isEditing ? "Leave blank to keep current password" : ""
                }
                required={!isEditing} // Only required for new accounts
              />
            </div>
          </div>

          <div className="form-buttons">
            <button type="submit" className="submit-button" disabled={loading}>
              {isEditing ? "Update Staff Account" : "Add Staff Account"}
            </button>

            {isEditing && (
              <button
                type="button"
                className="cancel-button"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="accounts-table-section">
        <div className="table-header">
          <h2>{showArchived ? "Archived Accounts" : "Current Accounts"}</h2>
          <button
            className="toggle-view-button"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? (
              <>
                <Users size={18} /> View Active Accounts
              </>
            ) : (
              <>
                <Archive size={18} /> View Archived Accounts
              </>
            )}
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(showArchived ? archivedAccounts : accounts).map((account) => (
                <tr key={account._id || account.employee_id}>
                  <td>{account.employee_id || "N/A"}</td>
                  <td>
                    {`${account.firstName || ""} ${
                      account.lastName || ""
                    }`.trim() || "N/A"}
                  </td>
                  <td>{account.username || "N/A"}</td>
                  <td>{account.email || "N/A"}</td>
                  <td>{account.contactNumber || "N/A"}</td>
                  <td>
                    <div className="actions-cell">
                      {!showArchived && (
                        <>
                          <button
                            className="icon-button edit"
                            onClick={() => handleUpdateAccount(account._id)}
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            className="icon-button archive"
                            onClick={() => handleArchiveAccount(account._id)}
                            title="Archive"
                          >
                            <Archive size={18} />
                          </button>
                        </>
                      )}
                      {showArchived && (
                        <button
                          className="icon-button unarchive"
                          onClick={() => handleUnarchiveAccount(account._id)}
                          title="Unarchive"
                        >
                          <ArchiveRestore size={18} />
                        </button>
                      )}
                      <button
                        className="icon-button delete"
                        onClick={() => handleDeleteAccount(account._id)}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewAccounts;
