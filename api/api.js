//import models file
const bcrypt = require("bcrypt");
const{message} =require("statuses");
//import the session configfiles
const sessionconfig = require("../session.config.js/sessionconfig")
const express = require("express");
const app = express();
app.use(sessionconfig);
const router =express.Router();

//initialize port number
const port = process.env.PORT || 3000;
//set the port usage
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


//import models
const {Customer,Admin,Books,Authors,Orders, Order_items } =require("../models/model")

//customer registration
router.post("/register", async (req, res, next) => {
    try {
        const { first_name, second_name, email, password } = req.body;
        if (!first_name || !second_name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newCustomer = await Customer.create({
            first_name: Sequelize.literal(`'${first_name.replace(/'/g, "''")}'`),
            second_name: Sequelize.literal(`'${second_name.replace(/'/g, "''")}'`),
            email: Sequelize.literal(`'${email.replace(/'/g, "''")}'`),
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully",
            customer: { id: newCustomer.id, name: newCustomer.first_name, email: newCustomer.email },
        });
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            res.status(400).json({ message: "Email already exists" });
        } else {
            next(error);
        }
    }
});

//login
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({ message: "All fields are required " });
        }

        // Check if the user is a customer
        let user = await Customer.findOne({ 
            where: { email: Sequelize.literal(`email = ${Sequelize.escape(email)}`) } 
        });

        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user ={
                id: user.id,
                name: user.first_name,
                email: user.email,
                role:"customer"
            };
            return res.json({
                message: "Login successful",
                role: "customer",
                user: { id: user.id, name: user.first_name, email: user.email, role: 'customer' }
            });
        }

        // Check if the user is an admin
        user = await Admin.findOne({ 
            where: { email: Sequelize.literal(`email = ${Sequelize.escape(email)}`) } 
        });

        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user ={
                id: user.id,
                name: user.first_name,
                email: user.email,
                role: "admin",
            };
            return res.json({
                message: "Login successful",
                role: "admin",
                user: { id: user.id, name: user.first_name, email: user.email, role: 'admin' }
            });
        }

        // If neither, return invalid email or password
        return res.status(401).json({ message: "Invalid email or password" });
    } catch (error) {
        next(error);
    }
});

//add a book
router.post("/books/add", async (req, res, next)=>{
    try {
        const{title, author_id,publish_year,price,stock}=req.body;
        if (!title|| !author_id|| !publish_year|| !price|| !stock) {
            return res.status(400).json({message: "provide all the details"})
        }
        const newBook = await Books.create({ title, author_id,publish_year,price,stock });
        res.status(201).json({
            message: "Book created successfully",
            product: newBook
        });
    } catch (error) {
        next(error);
    }
});
//Get all books
router.get("/books", async (res, next) => {
    try {
        const books = await Books.findAll({
            attributes: ['title', 'price', 'stock'],
            include: [{
                model: Authors,
                attributes: ['first_name', 'last_name', 'bio']
            }]
        });
        res.json(books);
    } catch (error) {
        next(error);
    }
});

///update a book
router.put("/book/update", async(req,res) =>{
    const{title, author_id,publish_year,price,stock}=req.body
    try {
        const searchBook = await Books.findOne({where: {title}});
        if (!searchBook) {
            return res.status(400).send("Invalid book");
        }
        searchBook.title =title;
        searchBook.author_id=author_id;
        searchBook.publish_year =publish_year;
        searchBook.price = price;
        searchBook.stock =stock;

        await searchBook.save();
        return res.status(200).send("product update");
    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).send("Cannot update product at the moment");
    }
});
// delete product path
router.delete("/book/delete", async(req, res) =>{
    const{ title}=req.body;
    try {
        if (!title) {
            return res.status(400).json({message: "Enter the booktitle"})        
        }
        const getBook = await Books.findOne({where: {title}});
        if (!getBook) {
            return res.status(400).send("Invalid book")        
        }
        await Books.destroy({ where: { title } });
            return res.status(200).json({message: "Book deleted"});        
    } catch (error) {
        return res.status(500).json({message: "Error occurred while deleting the product"});
    }
    
});
//add books to cart
router.post('/product/addtocart', async(req, res)=>{
    const{customer_id, book_id, quantity }=req.body;
    try {
        //check if book id exists
        const book = await Books.findByPk(book_id)
        if(!book) 
            return res.status(400).json({message:"Book not found"})
        //find or create a pending order for the user
        let order = await Orders.findOne({where:{customer_id: customer_id, status: 'pending'}});

        if(!order){
            //create a new pending orderif non exist
            await Orders.create({customer_id:customer_id, total_amount: 0});
        }
        //check if the product is already in cart
        let order_book =await Order_items.findOne({where: {order_id: order.id, book_id}
        });
        //if product exist in the cart, update the quantity
        if (order_book) {
            order_book.quantity+=quantity;
            await order_book.save();            
        }else{
            //otherwise create a new order item
            await Order_items.create({order_id: order.id, book_id,quantity, price: book.price});
        }
        //recalcualte the total amount 
        const total_amount = await Order_items.sum('price',{
            where: {order_id: order.id}
        });
        Orders.total_amount =total_amount;
        await Orders.save();

        res.status(200).json({ message: 'product added to cart', order});
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
        
    }
});
//view cart items
router.get('/cart', async (req, res) => {
    const { customer_id } = req.query;

    try {
        const order = await Order.findOne({
            where: { customer_id, status: 'pending' },
            include: [{
                model: Order_items,
                include: [Books]
            }]
        });

        if (!order) return res.status(404).json({ message: 'No items in the cart' });

        res.status(200).json({ order });
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
});
//make order path
// Place the order (complete the order)
router.post('/place-order', async (req, res) => {
    const { userId } = req.body;
  
    try {
      // Find the pending order for the user
      const order = await Order.findOne({
        where: {
          customerId: userId,
          status: 'pending'
        },
        include: [{
          model: Order_items,
          include: [Books]  // Include books details for each order item
        }]
      });
  
      if (!order) return res.status(404).send('No pending order found');
  
      // Change order status to completed
      order.status = 'completed';
      await order.save();
  
      // reduce product stock quantities
      for (const item of order.Order_items) {
        const stock = await Books.findByPk(item.book_id);
        if (stock) {
          Books.stock -= item.stock;
          await Books.save();
        }
      }
  
      res.status(200).json({ message: 'Order placed successfully', order });
    } catch (error) {
      console.error(error);
      res.status(500).send('Something went wrong');
    }
  });
  
//cancel an order
//1. by admin
router.post('/admin/cancel-order', async (req, res) => {
    const { order_id } = req.body;

    try {
        const order = await Order.findByPk(order_id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = 'cancelled';
        await order.save();

        res.status(200).json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
});

//2. by customer
router.post('/customer/cancel-order', async (req, res) => {
    const { order_id, customer_id } = req.body;

    try {
        const order = await Order.findOne({ where: { id: order_id, customer_id: customer_id } });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = 'cancelled';
        await order.save();

        res.status(200).json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
});
//check status
router.get('/order/status/:order_id', async (req, res) => {
    const { order_id } = req.params;

    try {
        const order = await Order.findByPk(order_id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        res.status(200).json({ 
            message: 'Order status retrieved successfully', 
            status: order.deliery_status 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
});
//path to create new admin
router.post('/admin/register', async (req, res, next) => {
    try {
        const { first_name, second_name, email, password } = req.body;
        if (!first_name || !second_name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = await Admin.create({
            first_name: Sequelize.literal(`'${first_name.replace(/'/g, "''")}'`),
            second_name: Sequelize.literal(`'${second_name.replace(/'/g, "''")}'`),
            email: Sequelize.literal(`'${email.replace(/'/g, "''")}'`),
            password: hashedPassword
        });

        res.status(201).json({
            message: "Admin registered successfully",
            admin: { id: newAdmin.id, name: newAdmin.first_name, email: newAdmin.email },
        });
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            res.status(400).json({ message: "Email already exists" });
        } else {
            next(error);
        }
    }
});

//export routers
module.exports=router;