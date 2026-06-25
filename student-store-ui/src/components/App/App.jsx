import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import SubNavbar from "../SubNavbar/SubNavbar";
import Sidebar from "../Sidebar/Sidebar";
import Home from "../Home/Home";
import ProductDetail from "../ProductDetail/ProductDetail";
import PastOrders from "../PastOrders/PastOrders";
import OrderDetail from "../OrderDetail/OrderDetail";
import NotFound from "../NotFound/NotFound";
import { removeFromCart, addToCart, getQuantityOfItemInCart, getTotalItemsInCart } from "../../utils/cart";
import { formatPrice } from "../../utils/format";
import { API_BASE_URL } from "../../utils/api";
import "./App.css";

function App() {

  // State variables
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [userInfo, setUserInfo] = useState({ name: "", email: "", dorm_number: ""});
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [isFetching, setIsFetching] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);

  // Fetch all products from the API on mount.
  useEffect(() => {
    const fetchProducts = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/products`);
        setProducts(res.data);
      } catch (err) {
        setError("Failed to load products.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchProducts();
  }, []);

  // Toggles sidebar
  const toggleSidebar = () => setSidebarOpen((isOpen) => !isOpen);

  // Functions to change state (used for lifting state)
  const handleOnRemoveFromCart = (item) => setCart(removeFromCart(cart, item));
  const handleOnAddToCart = (item) => setCart(addToCart(cart, item));
  const handleGetItemQuantity = (item) => getQuantityOfItemInCart(cart, item);
  const handleGetTotalCartItems = () => getTotalItemsInCart(cart);

  const handleOnSearchInputChange = (event) => {
    setSearchInputValue(event.target.value);
  };

  const handleOnCheckout = async () => {
    // Don't check out an empty cart.
    if (!Object.keys(cart).length) {
      setError("Your cart is empty.");
      return;
    }

    // Email is required so the order can be looked up / filtered later.
    if (!userInfo.email) {
      setError("Please enter your email.");
      return;
    }

    setIsCheckingOut(true);
    setError(null);

    // The contract requires a numeric customer_id; derive it from the
    // "Student ID" field, falling back to 1 when missing/non-numeric.
    const parsedId = parseInt(userInfo.name, 10);
    const customer_id = Number.isNaN(parsedId) ? 1 : parsedId;

    // Map the cart ({ [productId]: quantity }) into the order_items shape.
    const order_items = Object.entries(cart).map(([id, quantity]) => ({
      product_id: Number(id),
      quantity,
    }));

    try {
      const res = await axios.post(`${API_BASE_URL}/orders`, {
        customer_id,
        email: userInfo.email,
        order_items,
      });
      const orderResponse = res.data;

      // Build a product lookup so receipt lines can show product names.
      const productsById = products.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});

      // Adapt the flat order response into the shape CheckoutSuccess reads
      // (order.purchase.receipt.lines[]). Line 0 is the header.
      setOrder({
        ...orderResponse,
        purchase: {
          receipt: {
            lines: [
              "Thank you for your order!",
              `Order #${orderResponse.order_id}`,
              ...orderResponse.order_items.map((item) => {
                const product = productsById[item.product_id];
                const name = product ? product.name : `Product ${item.product_id}`;
                return `${item.quantity} x ${name} — ${formatPrice(item.price * item.quantity)}`;
              }),
              `Total: ${formatPrice(orderResponse.total_price)}`,
            ],
          },
        },
      });

      // Clear the cart on a successful order.
      setCart({});
    } catch (err) {
      setError("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  }


  return (
    <div className="App">
      <BrowserRouter>
        <Sidebar
          cart={cart}
          error={error}
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          isOpen={sidebarOpen}
          products={products}
          toggleSidebar={toggleSidebar}
          isCheckingOut={isCheckingOut}
          addToCart={handleOnAddToCart}
          removeFromCart={handleOnRemoveFromCart}
          getQuantityOfItemInCart={handleGetItemQuantity}
          getTotalItemsInCart={handleGetTotalCartItems}
          handleOnCheckout={handleOnCheckout}
          order={order}
          setOrder={setOrder}
        />
        <main>
          <SubNavbar
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            searchInputValue={searchInputValue}
            handleOnSearchInputChange={handleOnSearchInputChange}
          />
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  error={error}
                  products={products}
                  isFetching={isFetching}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  addToCart={handleOnAddToCart}
                  searchInputValue={searchInputValue}
                  removeFromCart={handleOnRemoveFromCart}
                  getQuantityOfItemInCart={handleGetItemQuantity}
                />
              }
            />
            <Route path="/orders" element={<PastOrders />} />
            <Route path="/orders/:order_id" element={<OrderDetail />} />
            <Route
              path="/:productId"
              element={
                <ProductDetail
                  cart={cart}
                  error={error}
                  products={products}
                  addToCart={handleOnAddToCart}
                  removeFromCart={handleOnRemoveFromCart}
                  getQuantityOfItemInCart={handleGetItemQuantity}
                />
              }
            />
            <Route
              path="*"
              element={
                <NotFound
                  error={error}
                  products={products}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                />
              }
            />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;
 