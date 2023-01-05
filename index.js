const express = require("express");
require('dotenv').config();

const ejs = require("ejs")
var bodyParse = require('body-parser');
const mysql = require('mysql2');
const session = require('express-session')
const CartModule = require("./functions/Cart")
const ejsLayout = require("express-ejs-layouts")

var con = mysql.createConnection({host : process.env.DB_HOST, user : process.env.DB_USER, database : process.env.DB_NAME, password : process.env.DB_PASSWORD})

const app = express();
app.use(bodyParse.urlencoded({extended : true}));
app.use(session({secret : "secret"}))
app.use(session({
    name : 'secret',
    secret : 'secret',
    resave :false,
    saveUninitialized: true,
    cookie : {
        maxAge:(1000 * 60 * 100)
    }      
}));

// for static
app.use(express.static('public'));
app.use(ejsLayout)
app.set("layout", "layout")
app.set('view engine', 'ejs');
// app.use

// routes
app.get("/", (req, res)=>{
    con.query(`SELECT * FROM product limit ${process.env.HOMEPAGE_LIMIT}`, (err, result)=>{
        if(err) {
            res.send("An error occurl"); return false;
        }
        res.render("pages/index", {result : result});
    })
})

app.post("/add-to-cart", (req, res)=>{
    var product_id = req.body.product_id;
    con.query(`SELECT item_name, item_price, item_image from product where item_id = ${product_id}`, (err, result) => {
        if(err) {
            res.send("Database error");
            return;
        }
        if(result.length == 0){
            res.send("No product found");
            return;
        }
        var product = {
            id : product_id, name : result[0].item_name, price : result[0].item_price, quantity : 1, image : result[0].item_image,
        }

        // if there is cart
        if(req.session.cart){
            var cart = req.session.cart;
            if(!CartModule.isProductInCart(cart, product.id)){
                cart.push(product)
            }
        }else{
            var cart = [product]
            req.session.cart = cart;
        }

        var total = CartModule.calculateTotal(cart)
        req.session.totalCart = total;
        
        res.redirect("/cart");

    })
})


app.get("/cart", (req, res) => {
    var cart = req.session.cart ? req.session.cart : [];
    var totalCart = req.session.totalCart ? req.session.totalCart : 0;

    res.render("pages/cart", {cart : cart, totalCart : totalCart})

})

app.post("/remove-cart", (req, res) => {
    var product = req.body.product_id;
    var cart = req.session.cart;

    if(!cart) {
        res.redirect('/cart');
        return;
    }

    for (let i = 0; i < cart.length; i++) {
        if(cart[i].id == product){
            cart.splice(i, 1);
        };
    }

    // we will recalculate the total
    var total = CartModule.calculateTotal(cart)
    req.session.cart = cart;
    req.session.totalCart = total;
    res.redirect("/cart")
})

app.post("/update-cart", (req, res) => {
    var product = req.body.product;
    var action = req.body.action;
    var cart = req.session.cart;

    for (let i = 0; i < cart.length; i++) {
        if(cart[i].id == product){
            var product_ = cart[i];
            console.log(product_)
            if(action == "increase") {
                product_.quantity = product_.quantity + 1
            }else{
                product_.quantity = product_.quantity - 1;
            }
            cart[i] = product_;
            console.log(product_)
        };
    }
    var total = CartModule.calculateTotal(cart)
    req.session.cart = cart;
    req.session.totalCart = total;
    res.send(true);
})

app.get("/checkout", (req, res) => {
    var cart = req.session.cart ? req.session.cart : [];
    var totalCart = req.session.totalCart ? req.session.totalCart : 0;

    res.render("pages/checkout", {cart : cart, totalCart : totalCart})
})

app.post("/post-order", (req, res) => {
    var name = req.body.name, email = req.body.email, city = req.body.city, address = req.body.address, cost = req.body.cost, status = 'not paid', data = new Date(), phone = req.body.phone;
    var cost = req.session.totalCart ? req.session.totalCart : 0;
    var cart = req.session.cart ? req.session.cart : [];

    if(cart.length == 0 || cost == 0){
        res.redirect('/cart');
        return;
    }
    con.connect((err)=>{
        if(err){
            res.send("database error");
            return;
        }

        var query = "INSERT INTO orders (cost, name, email, status, city, address, phone, date) values ?"
        var values = [[cost, name, email, status, city, address, phone, data]]
        con.query(query, [values], (err, result)=> {
            if(err) {
                res.send("database error")
                return;
            }
            var order_id = result.insertId
            cart.forEach(product => {
                query = "INSERT INTO order_items (order_id, product_id, product_name, product_price, product_image, product_quantity, order_date) values ?"
                values = [[order_id, product.id, product.name, product.price, product.image, product.quantity, data]] 
                con.query(query, [values]);
            });
            res.redirect(`/payment/${order_id}`)
        })
    })
})

app.get("/payment/:order", (req, res) => {
    console.log("here")
    res.render("pages/payment", {total : "100"});
})

app.get("/payment", (req, res) => {
    res.render("pages/payment", {total : 100});
})

app.get("/about", (req, res) => {
    res.render("pages/about");
})

app.get("/contact", (req, res) => {
    res.render("pages/contact");
})

app.get("*", (req, res) => {
    res.send("not found");
})

app.listen(3000, ()=>{
    console.log("app is liten")
})