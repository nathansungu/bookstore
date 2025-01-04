//import models file
const bcrypt = require("bcrypt");
const{message} =require("statuses");
const app = express();
const router =app.ROUTER();

//import models
const {Customer,Admin,Books,Authors,Order, Order_items } =require("../models/model")

//customer registration
app.post("/register", async (req, res, next)=>{
    try {
        const {first_name,second_name, email, password } = req.body;
        if (!first_name|| !second_name|| !email || !pasword) {
            return res.status(400).json({message: "All fields are required"});
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newCustomer = await Customer.create({first_name,second_name,email,password: hashedPassword});

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
app.post("/login", async (req, res, next) => {
    try {
        const{email, password} =req.body;
        if (!email|| !password) {
            return res.status(401).json({message: "All fields are required "});            
        }
        const customer = await Customer.findOne({ where: { email } });
        if (!customer || !(await bcrypt.compare(password, customer.password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        res.json({
            message: "Login successful",
            customer: {id: Customer.id, name: Customer.first_name, email: Customer.email}
        })
    } catch (error) {
        next(error);
    }
});

//add a book
app.post("/books/add", async (req, res, next)=>{
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
app.get("/bookss", async (req, res, next) =>{
    try {
        const books = await Books.findAll();
        res.json(books);
    } catch (error) {
        next(error);
    }
});

///update a book
app.put("/book/update", async(req,res, next) =>{
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
app.delete("/book/delete", async(req, res) =>{
    const{ title}=req.body;
    try {
        if (!title) {
            return res.status(400).json({message: "Enter the booktitle"})        
        }
        getBook = await Books.findOne({where: {title}});
        if (!getBook) {
            return res,ststus(400).send("Invalid book")        
        }
        await Books.destroy({ where: { title } });
            return res.status(200).json({message: "Book deleted"});        
    } catch (error) {
        return res.status(500).json({message: "Error occurred while deleting the product"});
    }
    
});
//add books to cart
router.post('/product/addtocart', async(req, res)=>{
    const{}=req.body;
})
//make order path
//cancel na order
//1. by admin
//2. by customer
//check status
//