const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
const URL = process.env.DB;

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

let users = [];

app.get("/", (req, res) => {
  res.json({ message: 10 });
});

app.get("/users", async (req, res) => {
  try {
    console.log(process.env.DB)
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

app.get("/user/:userId",async (req,res) => {
  try {
    const connection = await MongoClient.connect(URL); // mongodb+srv://<credentials>
    const db = connection.db("b56_wdt"); // use b56_wdt

    // db.users.insertOne({})
    const collection = db.collection("users");
    const userData= await collection.findOne({_id:new ObjectId(req.params.userId)});

    await connection.close();
    res.json(userData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
})

// Edit
app.put("/user/:userId", async (req, res) => {
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
