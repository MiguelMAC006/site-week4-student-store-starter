import ProductGrid from "../ProductGrid/ProductGrid"
import "./Home.css"

function Home({isFetching, products, addToCart, removeFromCart, searchInputValue, getQuantityOfItemInCart, activeCategory, }) {

  // Filters products by the active category if it is not 'All Categories'.
  const productsByCategory =
    Boolean(activeCategory) && activeCategory !== "All Categories"
      ? products.filter((p) => p.category === activeCategory)
      : products

  // Filters products by the active category if it is not 'All Categories',
  // then further filters the result by the search input value if it is not empty.
  const productsToShow = Boolean(searchInputValue)
    ? productsByCategory.filter((p) => p.name.toLowerCase().indexOf(searchInputValue.toLowerCase()) !== -1)
    : productsByCategory


  return (
    <div className="Home">
      <ProductGrid
        products={productsToShow}
        isFetching={isFetching}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        getQuantityOfItemInCart={getQuantityOfItemInCart}
      />
    </div>
  )
}

export default Home;
