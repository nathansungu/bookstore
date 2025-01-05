
<?php
//import dotenv
use Dotenv\Dotenv;
require_once __DIR__ . '/vendor/autoload.php';


$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

$servername = $_ENV['DB_SERVERNAME'];
$username = $_ENV['DB_USERNAME'];
$password = $_ENV['DB_PASSWORD'];
$dbname = $_ENV['DB_NAME'];

// Create connection
$conn = new mysqli($servername, $username, $password);
 
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
// Create the database if it doesn't exist
$sql = "CREATE DATABASE IF NOT EXISTS $dbname";
if ($conn->query($sql) === TRUE) {
    echo "Database created or exists already.";
} else {
    die("Error creating database: " . $conn->error);
}

// Select the database
$conn->select_db($dbname);

$Customers  = "CREATE TABLE Customers 
(id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
first_name VARCHAR(30) NOT NULL,
second_name VARCHAR(30) NOT NULL,
phone_no VARCHAR(30) NOT NULL,
password VARCHAR(50) NOT NULL,
email VARCHAR(50) NOT NULL,
reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)";

$admin = "CREATE TABLE Admin_user
(id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
first_name VARCHAR(30) NOT NULL,
second_name VARCHAR(30) NOT NULL,
phone_no VARCHAR(30) NOT NULL,
email VARCHAR(50) NOT NULL,
password VARCHAR(50),
reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)";

$books = "CREATE TABLE Books 
(id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
title VARCHAR(20) NOT NULL,
author_id INT(6) NOT NULL,
publish_year YEAR,
price FLOAT(10) NOT NULL,
stock INT(100) NOT NULL,
reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)";

$authors = "CREATE TABLE Authors(
id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
firstname VARCHAR(30) NOT NULL,
secondname VARCHAR(30) NOT NULL,
bio VARCHAR(255))";

$Orders = "CREATE TABLE Orders (
id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
customer_id INT(6) NOT NULL,
order_items_id INT(6),
total_amount FLOAT(6) NOT NULL,
status VARCHAR(20) NOT NULL,
delivery_status VARCHAR(20),
order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)";

$Order_items = "CREATE TABLE Order_items(
id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
book_id INT(6),
price FLOAT(100),
quantity INT(100))";
//declare foreign keys
$conn->query("ALTER TABLE Books 
    ADD CONSTRAINT fk_author_id 
    FOREIGN KEY (author_id) REFERENCES Authors(id)");
$conn->query("ALTER TABLE Orders 
    ADD CONSTRAINT fk_customer_id 
    FOREIGN KEY (customer_id) REFERENCES Customers(id)");
$conn->query("ALTER TABLE Order_items 
    ADD CONSTRAINT fk_book_id 
    FOREIGN KEY (book_id) REFERENCES Books(id)");


// Execute queries
$conn->query($Customers);
$conn->query($admin);
$conn->query($books);
$conn->query($authors);
$conn->query($Orders);
$conn->query($Order_items);

$conn->close();
?>
