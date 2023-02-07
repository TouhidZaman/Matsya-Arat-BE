require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

const cors = require("cors");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.atvif4l.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const db = client.db("fishManagerDB");
    const customersCollection = db.collection("customers");

    app.post("/customers", async (req, res) => {
      const user = req.body;
      const result = await customersCollection.insertOne(user);
      res.send(result);
    });

    //Get customers
    app.get("/customers/", async (req, res) => {
      try {
        const result = customersCollection.find({});
        const customers = await result.toArray();
        res.status(200).json(customers);
      } catch (err) {
        res.status(500).json(err);
      }
    });

    app.get("/customers/:id", async (req, res) => {
      const customerId = req.params.id;
      try {
        const user = await customersCollection.findOne({ _id: ObjectId(customerId) });
        res.status(200).json(user);
      } catch (err) {
        res.status(500).json(err);
      }
    });
  } finally {
  }
};

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send({
    status: true,
    data: {
      message: "Welcome to fish manager server",
      author: {
        name: "Muhammad Touhiduzzaman",
        email: "touhid4bd@gmail.com",
        url: "https://github.com/TouhidZaman",
      },
    },
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

