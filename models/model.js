// Import required modules
const express = require("express");
const { Sequelize, DataTypes, HasMany, BelongsTo, or } = require("sequelize");
const dotenv =require("dotenv");
const { charset } = require("mime-types");
const { orderBy } = require("lodash");
const app = express();

dotenv.config();

//middleware
app.use(express.json());
dotenv.config({ path: '../.env' });

//database connection
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_SERVERNAME,
  dialect: "mysql",
  dialectOptions: {
    charset: "utf8",
  },
  define: {
    charset: "utf8",
    collate: "utf8_general_ci",
    engine: "InnoDB",
  },
});

// Set database attributes to unsigned
Object.keys(sequelize.models).forEach(modelName => {
  const attributes = sequelize.models[modelName].rawAttributes;
  Object.keys(attributes).forEach(attributeName => {
    if (attributes[attributeName].type instanceof DataTypes.INTEGER) {
      attributes[attributeName].type = DataTypes.INTEGER.UNSIGNED;
    }
  });
});
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected!");
    await sequelize.sync({ alter: true });
    console.log("Models synchronized!");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
})();

// Error Handling Middleware
app.use((err, res) => {
  res.status(err.status || 500).json({
    error: true,
    message: err.message || "Internal Server Error",
  });
});
// customer model
const Customer = sequelize.define("Customer", {
  first_name: { type: DataTypes.STRING, allowNull: false },
  second_name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false},
  phone_no: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false }
});
// books model
const Books = sequelize.define("Books", {
  title: { type: DataTypes.STRING, allowNull: false },
  author_id: { type: DataTypes.INTEGER, allowNull: false },
  publish_year: { type: DataTypes.DATE, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },
  stock: { type: DataTypes.INTEGER, allowNull: false },
});

// admin model
const Admin = sequelize.define("Admin_users", {
  first_name: { type: DataTypes.STRING, allowNull: false },
  second_name: { type: DataTypes.STRING, allowNull: false },
  phone_no: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false }
});


// authors model
const Authors = sequelize.define("Authors", {
  first_name: { type: DataTypes.STRING, allowNull: false },
  second_name: { type: DataTypes.STRING, allowNull: false },
  bio: { type: DataTypes.STRING, allowNull: false }
});

// orders model
const Orders = sequelize.define("Orders", {
  customer_id: { type: DataTypes.INTEGER, allowNull: false },
  total_amount: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: true },
  delivery_status:{type :DataTypes.STRING, allowNull:false}
});

// order_items model
const Order_items = sequelize.define("Order_items", {
  order_id: {type:DataTypes.INTEGER, allowNull:false} ,
  book_id: { type: DataTypes.INTEGER, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false }
});
//relatioships
//customer orders
Customer.hasMany(Orders, { foreignKey: 'customer_id' });
Orders.belongsTo(Customer, { foreignKey: 'customer_id' });

Books.belongsTo(Authors, { foreignKey: 'author_id' });
Authors.hasMany(Books, { foreignKey: 'author_id' });

Order_items.belongsTo(Orders, { foreignKey: 'order_id' });
Orders.hasMany(Order_items, { foreignkey: 'order_id'});

Order_items.belongsTo(Books, { foreignKey: 'book_id' });
Books.hasMany(Order_items, { foreignKey: 'book_id' });


// export modules
module.exports = {  
  Customer,
  Admin,
  Books,
  Authors,
  Orders,
  Order_items}
