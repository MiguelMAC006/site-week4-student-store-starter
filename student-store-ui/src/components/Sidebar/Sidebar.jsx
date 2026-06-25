import { Link } from "react-router-dom"
import ShoppingCart from "../ShoppingCart/ShoppingCart"
import "./Sidebar.css"


function Sidebar({ cart, isOpen, products, userInfo, setUserInfo, toggleSidebar, handleOnCheckout,isCheckingOut, order, setOrder,error,}) {
  return (
    <section className={`Sidebar ${isOpen ? "open" : "closed"}`}>

      <div className="wrapper">

        <div className="logo">
            <Link to="/">
              <span className="wordmark">Student Store</span>
            </Link>
        </div>

        <Link to="/orders" className="past-orders-link" onClick={toggleSidebar}>
          Past Orders
        </Link>

        <span className={`toggle-button button ${isOpen ? "open" : "closed"}`} onClick={toggleSidebar}>
          <i className="material-icons md-48">arrow_forward</i>
        </span>

        <ShoppingCart
          isOpen={isOpen}
          cart={cart}
          products={products}
          toggleSidebar={toggleSidebar}
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          handleOnCheckout={handleOnCheckout}
          isCheckingOut={isCheckingOut}
          error={error}
          order={order}
          setOrder={setOrder}
        />
        
      </div>
    </section>
  )
}

export default Sidebar;