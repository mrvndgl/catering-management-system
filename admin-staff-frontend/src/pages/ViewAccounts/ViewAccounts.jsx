import React, { useState, useEffect } from "react";
import "./ViewAccounts.css";

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

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      console.log("Full accounts data:", JSON.stringify(accounts, null, 2));
      console.log("First account properties:", Object.keys(accounts[0]));
    }
  }, [accounts]);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching accounts...");
      const response = await fetch("/api/employees/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      console.log("Accounts fetched:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch accounts");
      }

      // Validate data structure
      if (Array.isArray(data)) {
        console.log(`Received ${data.length} accounts`);
        if (data.length > 0) {
          console.log("First account:", data[0]);
        }
        setAccounts(data);
      } else {
        console.error("Expected array but received:", typeof data);
        setError("Invalid data format received from server");
      }
    } catch (err) {
      console.error("Failed to fetch accounts", err);
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

    console.log("Form submission:", {
      isEditing,
      editingId,
      formData: newAccount,
    });

    try {
      const token = localStorage.getItem("token");
      let url, method;

      if (isEditing) {
        url = `/api/employees/staff/${editingId}`;
        method = "PUT";
      } else {
        url = "/api/employees/staff/create";
        method = "POST";
      }

      const dataToSend = {
        ...newAccount,
        employeeType: "staff",
      };

      console.log("Sending data to server:", dataToSend);

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const responseData = await response.json();
      console.log("Server response:", responseData);

      if (!response.ok) {
        throw new Error(
          responseData.message ||
            (isEditing
              ? "Failed to update account"
              : "Failed to create account")
        );
      }

      // After success, fetch fresh data instead of trying to update state
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

      // Exit editing mode
      if (isEditing) {
        setIsEditing(false);
        setEditingId(null);
      }
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
        <form onSubmit={handleSubmit} className="account-form">
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
        <h2>Current Accounts</h2>
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
              {accounts.map((account) => (
                <tr key={account._id || account.employee_id}>
                  <td>{account.employee_id || "N/A"}</td>
                  <td>
                    {account.firstName || account.lastName
                      ? `${account.firstName || ""} ${
                          account.lastName || ""
                        }`.trim()
                      : "N/A"}
                  </td>
                  <td>{account.username || "N/A"}</td>
                  <td>{account.email || "N/A"}</td>
                  <td>{account.contactNumber || "N/A"}</td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="edit-button"
                        onClick={() => handleUpdateAccount(account._id)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteAccount(account._id)}
                        disabled={loading}
                      >
                        Delete
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
