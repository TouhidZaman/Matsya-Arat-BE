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
    const paymentsCollection = db.collection("payments");

    app.post("/customers", async (req, res) => {
      const user = req.body;
      const result = await customersCollection.insertOne(user);
      res.send(result);
    });

    //Get customers
    app.get("/customers/", async (req, res) => {
      let query = {};
      let sortQuery = { createdAt: -1 };
      if (req.query.type) {
        query = { type: req.query.type };
      }
      if (req.query.sortBy) {
        sortQuery = { [req.query.sortBy]: -1 };
      }
      try {
        const result = customersCollection.find(query).sort(sortQuery);
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
      ####### sales API's #########
      #############################
    */

    //Add new Sale
    app.post("/sales", async (req, res) => {
      const newSale = req.body;
      if (newSale?.buyerId) {
        try {
          const paymentResult = await salesCollection.insertOne(newSale);
          const filter = { _id: ObjectId(newSale.buyerId) };
          const updateDoc = {
            $set: {
              dueAmount: newSale.totalWithDue - newSale.paid,
            },
          };
          await customersCollection.updateOne(filter, updateDoc);
          res.status(200).send(paymentResult);
        } catch (error) {
          res.status(500).send(error);
        }
      }
    });

    //Get all sales
    app.get("/sales/", async (req, res) => {
      try {
        const result = salesCollection.find({}).sort({ createdAt: -1 });
        const sales = await result.toArray();
        res.status(200).json(sales);
      } catch (err) {
        res.status(500).json(err);
      }
    });

    //Get sales by buyer
    app.get("/sales/buyer/:buyerId", async (req, res) => {
      const buyerId = req.params.buyerId;
      const query = { buyerId };
      try {
        const result = salesCollection.find(query).sort({ createdAt: -1 });
        const sales = await result.toArray();
        res.status(200).json(sales);
      } catch (err) {
        res.status(500).json(err);
      }
    });

    //Get sales by sellerId
    app.get("/sales/seller/:sellerId", async (req, res) => {
      const sellerId = req.params.sellerId;
      try {
        const result = salesCollection.aggregate([
          {
            $project: {
              buyerId: 1,
              buyerName: 1,
              lineItems: {
                $filter: {
                  input: "$lineItems",
                  as: "item",
                  cond: { $eq: ["$$item.sellerId", sellerId] },
                },
              },
              date: 1,
            },
          },
          {
            $group: {
              _id: "$date",
              salesByDate: {
                $push: {
                  buyerName: "$buyerName",
                  lineItems: "$lineItems",
                  date: "$date",
                },
                // $push: {
                //   lineItems: {
                //     $cond: [
                //       { $eq: [{ $size: "$lineItems" }, 0] },
                //       "$$REMOVE",
                //       {
                //         buyerName: "$buyerName",
                //         lineItems: "$lineItems",
                //         date: "$date",
                //       },
                //     ],
                //   },
                // },
              },
            },
          },
          { $sort: { _id: -1 } },
        ]);

        const sales = await result.toArray();
        res.status(200).json(sales);
      } catch (err) {
        res.status(500).json(err);
      }
    });

    // const result = salesCollection.find({
    //   date: "2023-02-28",
    //   lineItems: { $elemMatch: { sellerId: { $eq: sellerId } } },
    // });

    /*
      #############################
      ###### Payments API's #######
      #############################
    */

    //Add new payment
    app.post("/payments", async (req, res) => {
      const newPayment = req.body;
      if (newPayment?.buyerId) {
        try {
          const paymentResult = await paymentsCollection.insertOne(newPayment);
          const filter = { _id: ObjectId(newPayment.buyerId) };
          const updateDoc = {
            $set: {
              dueAmount: newPayment.currentDue,
            },
          };
          await customersCollection.updateOne(filter, updateDoc);
          res.status(200).send(paymentResult);
        } catch (error) {
          res.status(500).send(error);
        }
      }
    });

    //Get all payments
    app.get("/payments/", async (req, res) => {
      try {
        const result = paymentsCollection.find({}).sort({ createdAt: -1 });
        const payments = await result.toArray();
        res.status(200).json(payments);
      } catch (err) {
        res.status(500).json(err);
      }
    });

    //Get payments by buyer
    app.get("/payments/buyer/:buyerId", async (req, res) => {
      const buyerId = req.params.buyerId;
      const query = { buyerId };
      try {
        const result = paymentsCollection.find(query).sort({ createdAt: -1 });
        const payments = await result.toArray();
        res.status(200).json(payments);
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
      message: "Welcome to matsya-arat-server",
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
