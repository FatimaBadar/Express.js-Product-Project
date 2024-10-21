var express = require("express");
var app = express();
var bcrypt = require("bcrypt");
var conn = require("./db");
var session = require("express-session");

//to use session
app.use(
  session({
    secret: "smth",
    resave: true,
    saveUninitialized: true,
  })
);

//setup the view engine
app.set("view engine", "ejs");

//Middleware -after post form to get data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Routes home
app.get("/", function (req, res) {
  res.render("home");
});

//Route login
app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/loginUser", function (req, res) {
  var sql = "SELECT * FROM users WHERE username = ?";
  conn.query(sql, [req.body.username], (err, results) => {
    if (err) throw err;
    console.log("user found in db");

    if (results.length > 0) {
      var user = results[0];
      var passwordMatch = bcrypt.compareSync(req.body.password, user.Password);

      if (passwordMatch) {
        req.session.username = req.body.username;
        req.session.userId = user.Id;
        req.session.loggedIn = true;
        console.log("Login Successfully");

        //Redirect to product dashboard
        res.redirect("./product");
      } else {
        console.log("Wrong password. Login Failed");
        res.redirect("./login");
        res.end();
      }
    } else {
      console.log("User not found");
      res.redirect("./login");
      res.end();
    }
  });
});

//Route register
app.get("/register", function (req, res) {
  res.render("register");
});

//User Registration
app.post("/reg", (req, res) => {
  if (req.body.password != req.body.confirmpassword) {
    console.log("Password not match");
    res.redirect("/register");
    res.end();
  } else {
    console.log("Password match");
    //hash password
    var hashedPassword = bcrypt.hashSync(req.body.password, 10);

    //Add to DB
    var sql = "INSERT INTO users(username, password) VALUES (?,?)";
    conn.query(sql, [req.body.username, hashedPassword], (err, result) => {
      if (err) {
        console.log("Couldn't register user");
        throw err;
      }
      console.log("User registered successfully");
      res.redirect("/login");
    });
  }
});

//product page with product list
app.get("/product", function (req, res) {
  if (!req.session.loggedIn) {
    res.redirect("/login");
    res.end();
  } 
  else {
    var sql =
      "SELECT p.id, p.name, pr.rating FROM products p LEFT OUTER JOIN product_rating pr ON p.id = pr.product_id AND pr.user_id = ?";
        conn.query(sql, [req.session.userId], (err, result) => {
        if (err) throw err;
        res.render("products", {
            title: "List of Products",
            ProductData: result,
        });
    });
  }
});

//Product rating by a user
app.post("/SubmitRating", function (req, res) {
  if (req.body) {
    var sql =
      "SELECT * from product_rating where user_id = ? AND product_id = ?";
    conn.query(sql, [req.session.userId, req.body.productId], (err, result) => {
      if (err) throw err;

      if (result.length > 0) {
        var sql2 = "UPDATE product_rating SET rating = ? WHERE user_id = ?";

        conn.query(
          sql2,
          [req.body.rating, req.body.productId],
          (err, result) => {
            if (err) throw err;
            res.send(
              "Updated rating for product id " +
                req.body.productId +
                " and user: " +
                req.session.userId
            );
          }
        );
      } else {
        var sql3 =
          "INSERT INTO product_rating(product_id, user_id, rating) Values(?, ?, ?)";

        conn.query(
          sql3,
          [req.body.productId, req.session.userId, req.body.rating],
          (err, result) => {
            if (err) throw err;
            res.send(
              "Inserted rating for product id " +
                req.body.productId +
                " and user: " +
                req.session.userId
            );
          }
        );
      }
    });
  }
});

app.get('/logout', function(req, res){
    req.session.destroy()
    res.redirect('/')
    res.end();
})
app.listen(3000);
console.log("Server started on port 3000");
