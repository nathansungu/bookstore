//import models file
const Sequelize = require('sequelize');
const bcrypt = require("bcrypt");
const{message} =require("statuses");
//import the session configfiles
const sessionconfig = require("../session.config.js/sessionconfig")
const express = require("express");
const app = express();
app.use(sessionconfig);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const router =express.Router();

//initialize port number
const port = process.env.PORT || 3000;
//set the port usage
app.use(router);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Models are already imported above
//import models
const {Customer,Admin,Books,Authors,Orders, Order_items } =require("../models/model");

//customer registration
router.post("/register/customer", async (req, res, next) => {
    try {
        const { first_name, second_name, email,phone_no, password } = req.body;
        if (!first_name || !second_name || !email || !phone_no|| !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newCustomer = await Customer.create({
            first_name: Sequelize.literal(`'${first_name.replace(/'/g, "''")}'`),
            second_name: Sequelize.literal(`'${second_name.replace(/'/g, "''")}'`),
            email: Sequelize.literal(`'${email.replace(/'/g, "''")}'`),
            phone_no: Sequelize.literal(`'${phone_no.replace(/'/g, "''")}'`),
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
            where: { email: Sequelize.literal(`email = '${email.replace(/'/g, "''")}'`) } 
        });

        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user ={
                id: user.id,
                name: user.first_name,
                email: user.email,
                role:"customer"
            }
            return res.json({
                message: "Login successful",
                role: "customer",
                user: { id: user.id, name: user.first_name, email: user.email, role: 'customer' }
            });
        }

        // Check if the user is an admin
        user = await Admin.findOne({ 
            where: { email: Sequelize.literal(`email = '${email.replace(/'/g, "''")}'`) } 
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
// forgot password
router.post("/forgot-password", async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Check if the user is a customer
        let user = await Customer.findOne({ where: { email: email} });
        if (user) {
            return res.json({ message: "Password reset link sent to your email" });
        }

        // Check if the user is an admin
        user = await Admin.findOne({ where: { email: email } });
        if (user) {
            // send password reset link to the email
            const resetLink = `http://example.com/reset-password?email=${encodeURIComponent(email)}`;
            // Here you would typically send the reset link via email using a service like nodemailer
            console.log(`Password reset link: ${resetLink}`);
            
            return res.json({ message: "Password reset link sent to your email" });
        }

        return res.status(404).json({ message: "User not found" });
    } catch (error) {
        next(error);
    }
});

//add a book
router.post("/books/add", async (req, res, next)=>{
    try {
        const{title, author_id,publish_year,price,stock,}=req.body;
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
router.get("/books", async (req, res, next) => {
    try {
        const books = await Books.findAll({
            attributes: ['title', 'price', 'stock'],
            include: [{
                model: Authors,
                attributes: ['first_name', 'second_name', 'bio']
            }]
        });
        if(!books) {
            return res.status(404).json({message: 'No books found'});
        }
        return res.status(201).json({message: books});
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
        searchBook.title = title;
        searchBook.author_id=author_id;
        searchBook.publish_year =publish_year;
        searchBook.price = price;
        searchBook.stock =stock;

        await searchBook.save();
        return res.status(200).send("product updated successfully");
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
    const { customer_id, book_id, quantity } = req.body;
    try {
        //check if book id exists
        const book = await Books.findByPk(book_id);
        if (!book){
            return res.status(400).json({ message: "Book not found" });
        }
        //find or create a pending order for the user
        let order = await Orders.findOne({ where: { customer_id: customer_id, status: 'pending' } });
        if (order) {
            //check items table for the same item update the quantity
            let samebook = await Order_items.findOne({ where: { book_id: book_id, id: order.id } });
            if (samebook) {
            samebook.quantity += quantity;
            await samebook.save();
            } else{
                // create a new order item if the book is not in the cart
                await Order_items.create({ OrderId: order.id, book_id, quantity, price: book.price});
            }
        } else {
            //create a new pending order if none exist
            //
            order = await Orders.create({ customer_id: customer_id, total_amount: 0, status: 'pending', delivery_status: 'pending' });
            await Order_items.create({OrderId: order.id, book_id, quantity, price: book.price });
        }
       
        // Recalculate the total amount by multiplying the quantity with the price
        const itemsquantity = await Order_items.findOne({where: { order_id: order.id}});
        
        const total_amount = itemsquantity.quantity * book.price;
        order.total_amount = total_amount;
        await order.save();

        res.status(200).json({ message: 'Product added to cart', order });
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
});
//view cart items
router.get('/cart', async (req, res) => {
    const {customer_id}=req.body;
    if (!customer_id) {
        return res.status(400).json({ message: 'Valid customer ID is required' });
    }
    try {
        const order = await Orders.findAll({
            where: { customer_id, status: 'pending' },
            attributes: ['id', 'total_amount', 'status'],
            include: [
            {
                model: Order_items,
                attributes: ['id', 'order_id','price', 'quantity'],
                include: [
                {
                    model: Books,
                    attributes: ['id', 'title'],
                    include: [
                    {
                        model: Authors,
                        attributes: ['id', 'first_name', 'second_name', 'bio'],
                    },
                    ],
                },
                ],
            },
            ],
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
router.post('/placeorder', async (req, res) => {
    const {customer_id} = req.body;
  
    try {
      // Find the pending order for the user
    const order = await Orders.findOne({
      where: {
        customer_id: customer_id,
        status: 'pending'
      },
      include: [
        {
        model: Order_items,
        include: [
          {
            model: Books,
            attributes: ['id', 'title', 'price', 'stock'],
            include: [
            {
              model: Authors,
              attributes: ['id', 'first_name', 'second_name', 'bio'],
            },
            ],
          },
        ],
        },
      ],
    });
  
      if (!order) return res.status(404).send('No items in your cart. Add to cart to order');
  
      // Change order status to completed
      order.status = 'completed';
      await order.save();
  
      // reduce product stock quantities
      for (const item of order.Order_items) {
        const stock = await Books.findByPk(item.book_id);
        if (stock) {
          stock.stock -= item.quantity;
          await stock.save();
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
        const order = await Orders.findByPk(order_id);
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
    const { orderid, customer_id } = req.body;
    if (!orderid || !customer_id) {
        return res.status(400).json({ message: 'Order ID and customer ID are required' });
    }

    try {
        const order = await Orders.findOne({ where: { id: orderid, customer_id: customer_id } });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = 'cancelled';
        await order.save();

        res.status(200).json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
});
//update delivery status by id
router.put('/order/update_delivery_status', async (req, res) => {
    const { orderid, delivery_status } = req.body;
    if (!orderid || !delivery_status) {
        return res.status(400).json({ message: 'Order ID and delivery status are required' });
    }

    try {
        const order = await Orders.findByPk(orderid);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.delivery_status = delivery_status;
        await order.save();

        res.status(200).json({ message: 'Delivery status updated successfully', order });
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
});

//check delivery status
router.get('/order/delivery_status', async (req, res) => {
    const {orderid , customer_id } = req.body;

    try {
        const order = await Orders.findOne({ where: { id: orderid, customer_id: customer_id } });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        res.status(200).json({ 
            message: 'Order status retrieved successfully', 
            status: order.delivery_status 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
});
//path to create new admin
//
//
router.post('/admin/register', async (req, res, next) => {
    try {
        const { first_name, second_name, email,phone_no, password } = req.body;
        if (!first_name || !second_name || !email || !phone_no || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = await Admin.create({
            first_name: Sequelize.literal(`'${first_name.replace(/'/g, "''")}'`),
            second_name: Sequelize.literal(`'${second_name.replace(/'/g, "''")}'`),
            email: Sequelize.literal(`'${email.replace(/'/g, "''")}'`),
            phone_no: Sequelize.literal(`'${phone_no.replace(/'/g, "''")}'`),
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
// view all admins
router.get('/admins', async ( req,res) => {
    try {
        const admins = await Admin.findAll();
        if (!admins) return res.status(404).json({ message: 'No admins found' });

        res.status(200).json({ admins });
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
});
// path to add authors
router.post('/authors/add', async (req, res) => {
    const { first_name, second_name, bio } = req.body;

    try {
        if (!first_name || !second_name || !bio) {
            return res.status(400).json({ message: 'All fields are required' });
                      
        }
         //check if the author already exists
         const author = await Authors.findOne({ where: { first_name, second_name } });
            if (author) {
                return res.status(400).json({ message: 'Author already exists' });
                
            };
            const newauthor = await Authors.create({ first_name, second_name, bio });
                res.status(201).json({ message: 'Author added successfully', author: newauthor })
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
});
//get all authors
router.get('/authors', async (req, res) => {
    try {
        const authors = await Authors.findAll();
        if (!authors) return res.status(404).json({ message: 'No authors found' });

        res.status(200).json({ authors });
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
});


//export routers
module.exports=router;