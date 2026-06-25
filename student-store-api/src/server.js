const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const orderItemRoutes = require("./routes/orderItemRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Welcome to Student Store");
});

app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/order-items', orderItemRoutes);

app.listen(3000, () => {
    console.log("Server is running on port 3000")
});
