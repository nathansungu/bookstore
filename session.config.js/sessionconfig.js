const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

const options = {
    host: "localhost",
    port: 3306,
    user: "your-username", 
    password: "your-password",
    database: "sessionDB"
};

const sessionStore = new MySQLStore(options);

const sessionConfig = session({
    secret: "your-secret-key", // Replace with a secure, random key
    resave: false, // Avoid resaving unchanged sessions
    saveUninitialized: false, // Do not save empty sessions
    store: sessionStore,
    cookie: {
        httpOnly: true, // Prevent client-side access to cookies
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000, // Session expires after 1 day
    },
});

module.exports = sessionConfig;
