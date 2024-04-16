const express = require("express");
const cors = require("cors");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
// const URL = process.env.DB;
const URL =
  "mongodb+srv://vasanth:admin123@cluster0.rqnnzqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

let users = [];

function authenticate(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "Not Authorized" });
  }

  jwt.verify(req.headers.authorization, "world2024", (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Not a Valid Token" });
    }
    console.log(decoded);
    req.payload = decoded;
    next();
  });
}

function permit(module) {
  // console.log(allowedUser)
  return (req, res, next) => {
    console.log(req.method);
    const permissions = req.payload.permissions[module]; // ["GET","POST"]
    if (permissions.findIndex((p) => p == req.method) !== -1) {
      next();
    } else {
      res.status(401).json({
        message: "UnAuthorized",
      });
    }

    // if (req.userType && isAllowed(req.userType)) {
    //   next();
    // } else {
    //   res.status(401).json({
    //     message: "UnAuthorized",
    //   });
    // }
  };
}
app.get("/", (req, res) => {
  res.json({ message: 10 });
});

app.post("/register", async (req, res) => {
  try {
    const connection = await MongoClient.connect(URL);
    const db = connection.db("b56_wdt");
    const collection = db.collection("members");

    // Hash
    const salt = bcryptjs.genSaltSync(10);
    const hash = bcryptjs.hashSync(req.body.password, salt);
    req.body.password = hash;

    await collection.insertOne(req.body);
    await connection.close();
    res.json({ message: "User Created" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const connection = await MongoClient.connect(URL);
    const db = connection.db("b56_wdt");
    const collection = db.collection("members");

    const member = await collection.findOne({ email: req.body.email });
    if (member) {
      const isPassword = bcryptjs.compareSync(
        req.body.password,
        member.password
      );
      if (isPassword) {
        // Gen Token
        const token = jwt.sign(
          {
            id: member._id,
            name: member.name,
            permissions: {
              users: ["GET", "POST"],
              products: ["GET"],
            },
          },
          "world2024",
          { expiresIn: "1h" }
        );
        res.json({ token });
      } else {
        res.status(404).json({ message: "Invalid Credientials" });
      }
    } else {
      res.status(404).json({ message: "Invalid Credientials" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something Went Wrong!" });
  }
});
// Midleware
app.get("/users", [authenticate, permit("users")], async (req, res) => {
  try {
    console.log(process.env.DB);
    const connection = await MongoClient.connect(URL);
    const db = connection.db("b56_wdt");
    const collection = db.collection("users");
    const users = await collection
      .find({
        isDeleted: { $exists: false },
      })
      .toArray();
    await connection.close();
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/user", async (req, res) => {
  // req.body.id = users.length + 1;
  // users.push(req.body);
  // res.json({ message: "User Created" });

  try {
    const connection = await MongoClient.connect(URL); // mongodb+srv://<credentials>
    const db = connection.db("b56_wdt"); // use b56_wdt

    // db.users.insertOne({})
    const collection = db.collection("users");
    await collection.insertOne(req.body);

    await connection.close();
    res.json({ message: "User Created" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.get("/user/:userId", async (req, res) => {
  try {
    const connection = await MongoClient.connect(URL); // mongodb+srv://<credentials>
    const db = connection.db("b56_wdt"); // use b56_wdt

    // db.users.insertOne({})
    const collection = db.collection("users");
    const userData = await collection.findOne({
      _id: new ObjectId(req.params.userId),
    });

    await connection.close();
    res.json(userData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Edit
app.put("/user/:userId",[authenticate,permit("users")], async (req, res) => {
  try {
    const connection = await MongoClient.connect(URL);
    const db = connection.db("b56_wdt");
    const collection = db.collection("users");
    await collection.updateOne(
      { _id: new ObjectId(req.params.userId) },
      { $set: req.body }
    );
    await connection.close();
    res.json({ message: "User Updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something Went Wrong" });
  }

  // let params = req.params.userId;
  // let index = users.findIndex((user) => user.id == params);
  // req.body.id = params;
  // users[index] = req.body;
  // res.json({ message: "User Updated" });
});

app.delete("/user/:userId", async (req, res) => {
  // let params = req.params.userId;
  // // users = users.filter((user) => user.id != params);
  // let index = users.findIndex((user) => user.id == params);
  // users.splice(index, 1);
  // res.json({ message: "User Deleted" });

  try {
    const connection = await MongoClient.connect(URL);
    const db = connection.db("b56_wdt");
    const collection = db.collection("users");
    await collection.updateOne(
      { _id: new ObjectId(req.params.userId) },
      { $set: { isDeleted: true } }
    );
    connection.close();
    res.json({ message: "User Deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.listen(3000);
