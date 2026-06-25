import { useNavigate } from "react-router-dom"
import "./SubNavbar.css"

function SubNavbar({ activeCategory, setActiveCategory, searchInputValue, handleOnSearchInputChange }) {

  const navigate = useNavigate();

  const categories = ["All Categories", "Accessories", "Apparel", "Books", "Snacks", "Supplies"];

  // Selecting a category filters the product grid, which only lives on the home
  // route — so navigate home as well (otherwise clicking a tab on e.g. the Past
  // Orders page silently sets state with nothing visible).
  const handleSelectCategory = (cat) => {
    setActiveCategory(cat);
    navigate("/");
  };

  return (
    <nav className="SubNavbar">

      <div className="content">

        <div className="row">
          <div className="search-bar">
            <input
              type="text"
              name="search"
              placeholder="Search"
              value={searchInputValue}
              onChange={handleOnSearchInputChange}
            />
            <i className="material-icons">search</i>
          </div>
        </div>

        <div className="row">
          <ul className={`category-menu`}>
            {categories.map((cat) => (
              <li className={activeCategory === cat ? "is-active" : ""} key={cat}>
                <button onClick={() => handleSelectCategory(cat)}>{cat}</button>
              </li>
            ))}
          </ul>
        </div>
        
      </div>
    </nav>
  )
}

export default SubNavbar;