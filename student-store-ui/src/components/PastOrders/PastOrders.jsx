import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { formatPrice, formatDate } from "../../utils/format";
import { API_BASE_URL } from "../../utils/api";
import "./PastOrders.css";

function PastOrders() {
  const [orders, setOrders] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  // Fetch orders, optionally filtered by email via the ?email= query param.
  // Called on mount (no email = full list) and on filter submit / clear.
  const fetchOrders = async (email) => {
    setIsFetching(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/orders`, {
        params: email ? { email } : {},
      });
      setOrders(res.data);
    } catch (err) {
      setError("Failed to load orders.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleFilter = (event) => {
    event.preventDefault();
    const email = emailInput.trim();
    if (!email) return;
    setActiveFilter(email);
    fetchOrders(email);
  };

  // Navigate back to the full, unfiltered list.
  const handleClearFilter = () => {
    setEmailInput("");
    setActiveFilter("");
    fetchOrders();
  };

  return (
    <div className="PastOrders">
      <h1 className="title">Past Orders</h1>

      <form className="filter-form" onSubmit={handleFilter}>
        <input
          type="email"
          className="filter-input"
          placeholder="Filter by email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
        />
        <button type="submit" className="filter-button">Filter</button>
        {activeFilter && (
          <button type="button" className="clear-button" onClick={handleClearFilter}>
            Show all orders
          </button>
        )}
      </form>

      {isFetching ? (
        <h1>Loading...</h1>
      ) : error ? (
        <p className="error">{error}</p>
      ) : orders.length === 0 ? (
        <p className="empty">
          {activeFilter ? `No orders found for ${activeFilter}.` : "No past orders."}
        </p>
      ) : (
        <ul className="order-list">
          <li className="order-row header">
            <span className="col id">Order ID</span>
            <span className="col date">Date</span>
            <span className="col email">Email</span>
            <span className="col total">Total</span>
            <span className="col status">Status</span>
          </li>
          {orders.map((order) => (
            <li key={order.order_id} className="order-row">
              <Link to={`/orders/${order.order_id}`} className="order-link">
                <span className="col id">#{order.order_id}</span>
                <span className="col date">{formatDate(order.created_at)}</span>
                <span className="col email">{order.email}</span>
                <span className="col total">{formatPrice(order.total_price)}</span>
                <span className="col status">{order.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PastOrders;
