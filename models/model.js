// Import required modules
const express = require("express");
const bcrypt = require("bcrypt");
const { Sequelize, DataTypes } = require("sequelize");
const dotenv = require("dotenv");
const { message } = require("statuses");
const { type } = require("os");
const { title } = require("process");
const app = express();

dotenv.config();

//middleware
app.use(express.json());

//database connection
const Sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB?PassThrough,{
    host: process.env.DB_HOST,
    Dialect: "mysql",    
});
//sync database
(async () => {
    try {
      await Sequelize.authenticate();
      console.log("Database connected!");
      await Sequelize.sync({ alter: true });
      console.log("Models synchronized!");
    } catch (error) {
      console.error("Error connecting to the database:", error);
    }
  })();

  // Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      error: true,
      message: err.message || "Internal Server Error",
    });
  });
// customer model

const Customer = Sequelize.define("Customer" ,{
    first_name: {type: DataTypes.STRING, allowNull: false},
    second_name:{type: DataTypes.STRING, allownull:false},
    email: { type: DataTypes.STRING, allowNull:false, unique:true},
    phone_no:{type: DataTypes.STRING, allownull:false},
    password: { type: DataTypes.STRING, allowNull: false}
});
//export module
module.exports = Customer;

const Admin = Sequelize.define("Admin", {
    first_name:{type:DataTypes.STRING, allowNull:false},
    second_name:{type:DataTypes.STRING, allowNull:false},
    phone_no:{ type:DataTypes.STRING, allowNull:false},
    email:{type:DataTypes.STRING, allowNull:false},
    password: {type:DataTypes.STRING, allowNull:false}
});
///export admin modele
module.exports =Admin;
const Books = Sequelize.define("Boooks", {
    title:{type: DataTypes.STRING, allowNull:false },
    author_id:{ type: DataTypes.INTEGER, allowNull:false},
    publish_year: {type: DataTypes.DATE, allowNull:false},
    price: {type: DataTypes.FLOATE, allowNull:false},
    stock: { type: DataTypes.INTEGER, allowNull: false },

});
//export Books module
module.exports =Books;
const Authors = Sequelize.define("Authors", {
    firstname: {type: DataTypes.STRING, allowNull:false},
    second_name: {type:DataTypes.STRING, allowNull:false},
    bio: {type: DataTypes.STRING, allowNull:false}
});
// export Authors module
module.exports =Authors;
const Orders  = Sequelize.define ("Orders",{
    customer_id:{type:DataTypes.INTEGER, allowNull:false},
    order_items_id:{type:DataTypes.INTEGER, allowNull:false},
    total_amount:{type:DataTypes.FLOAT, allowNull:false},
    status:{type:DataTypes.STRING, allowNull},
    order_date: {type:DataTypes.DATE, allowNull:false}
});
//export orders
module.exports =Orders;
const Order_items = Sequelize.define ("Order_items", {
    book_id: {type: DataTypes.STRING, allowNull:false},
    price: {type:DataTypes.STRING, allowNull},
    quantity: {type: DataTypes.INTEGER, allowNull:false}
});
//export order_items
module.exports =Order_items;

