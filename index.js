const express = require("express");
require('dotenv').config();

const ejs = require("ejs")
var bodyParse = require('body-parser');
const mysql = require('mysql2');
const session = require('express-session')
const CartModule = require("./functions/Cart")


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

app.get("*", (req, res) => {
    res.send("not found");
})

app.listen(3000, ()=>{
    console.log("app is liten")
})