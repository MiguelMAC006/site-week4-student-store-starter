import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import NotFound from "../NotFound/NotFound";
import { formatPrice, formatDate } from "../../utils/format";
import { API_BASE_URL } from "../../utils/api";
import "./OrderDetail.css";

function OrderDetail() {
  const { order_id } = useParams();
  const [order, setOrder] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  // Fetch the single order (with its items) whenever the route's order_id changes.
  useEffect(() => {
    const fetchOrder = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/orders/${order_id}`);
        setOrder(res.data);
      } catch (err) {
        setError("Order not found.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchOrder();
  }, [order_id]);

  if (error) {
    return <NotFound />;
  }

  if (isFetching || !order) {
    return <h1>Loading...</h1>;
  }

  return (
    <div className="OrderDetail">
      <Link to="/orders" className="back-link">&larr; Back to Past Orders</Link>

      <div className="order-card">
        <header className="order-head">
          <h1 className="order-title">Order #{order.order_id}</h1>
          <div className="order-meta">
            <span className="date">{formatDate(order.created_at)}</span>
            <span className="status">{order.status}</span>
          </div>
        </header>

        <ul className="items">
          <li className="item header">
            <span className="col product">Item</span>
            <span className="col qty">Qty</span>
            <span className="col unit">Unit Price</span>
            <span className="col line">Line Total</span>
          </li>
          {order.order_items.map((item) => (
            <li key={item.order_item_id} className="item">
              <span className="col product">Product #{item.product_id}</span>
              <span className="col qty">{item.quantity}</span>
              <span className="col unit">{formatPrice(item.price)}</span>
              <span className="col line">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <footer className="order-foot">
          <span className="total-label">Total</span>
          <span className="total-value">{formatPrice(order.total_price)}</span>
        </footer>
      </div>
    </div>
  );
}

export default OrderDetail;
