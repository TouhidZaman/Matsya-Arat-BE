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
    const salesCollection = db.collection("sales");

    app.post("/customers", async (req, res) => {
      const user = req.body;
      const result = await customersCollection.insertOne(user);
      res.send(result);
    });

    //Get customers
    app.get("/customers/", async (req, res) => {
      let query = {};
      if (req.query.type) {
        query = { type: req.query.type };
      }
      try {
        const result = customersCollection.find(query);
        const customers = await result.toArray();
        res.status(200).json(customers);
      } catch (err) {
        res.status(500).json(err);
      }
    });

    app.get("/customers/:id", async (req, res) => {
      const customerId = req.params.id;
      try {
        const customer = await customersCollection.findOne({
          _id: ObjectId(customerId),
        });
        res.status(200).json(customer);
      } catch (err) {
        res.status(500).json(err);
      }
    });

    //Updating a Customer
    app.patch("/customers/:id", async (req, res) => {
      const customerId = req.params?.id;
      const updatedCustomer = req.body;
      try {
        const filter = { _id: ObjectId(customerId) };
        const updateDoc = {
          $set: {
            ...updatedCustomer,
          },
        };
        const result = await customersCollection.updateOne(filter, updateDoc);
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send(error);
      }
    });

    /*
      #############################
      #### sales API's #####
      #############################
    */

    //Add transaction
    app.post("/sales", async (req, res) => {
      const newSale = req.body;
      if (newSale?.buyerId) {
        try {
          const saleResult = await salesCollection.insertOne(newSale);
          const filter = { _id: ObjectId(newSale.buyerId) };
          const updateDoc = {
            $set: {
              dueAmount: newSale.totalWithDue - newSale.paid,
            },
          };
          await customersCollection.updateOne(filter, updateDoc);
          res.status(200).send(saleResult);
        } catch (error) {
          res.status(500).send(error);
        }
      }
    });

    //Get transaction
    app.get("/sales/", async (req, res) => {
      try {
        const result = salesCollection.find({});
        const sales = await result.toArray();
        res.status(200).json(sales);
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
