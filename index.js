const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;

// middleware

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://jobsPortal:uu8UIJyLrKQDiZnh@cluster0.xifd9dy.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobsPortalCollection = client.db("jobsDB").collection("jobs");

    const indexKey = { title: 1, category: 1 };
    const indexOption =  { name : "titleCategory"};
    const result  = await jobsPortalCollection.createIndex(indexKey, indexOption);


    app.get('/jobsearch/:text' , async(req, res) => {
        const text =  req.params.text;
        const result = await jobsPortalCollection.find({
            $or : [
                {title : {$regex: text, $options: 'i'}},
                {category : {$regex: text, $options: 'i'}},
            ] ,
        }).toArray();

        res.send(result)
    })

    app.post("/postjob", async (req, res) => {
      const data = req.body;
      data.createTime = new Date();
      console.log(data);
      if (!data) {
        return res.status(404).send({ message: "error" });
      }
      const result = await jobsPortalCollection.insertOne(data);
      console.log(result);
      res.send(result);
    });

    app.get("/jobs/:text", async (req, res) => {
      const text = req.params.text;

      if (text == "remote" || text == "offline") {
        const result = await jobsPortalCollection
          .find({ status: text })
          .sort({ createTime: -1 })
          .toArray();
        return res.send(result);
      } else {
        const result = await jobsPortalCollection
          .find()
          .sort({ createTime: -1 })
          .toArray();
        res.send(result);
      }
    });

    app.get("/myjob/:email", async (req, res) => {
      const mail = req.params.email;
      console.log(mail);
      const result = await jobsPortalCollection
        .find({ postedBy: mail })
        .toArray();
      res.send(result);
    });

    app.put('/updatejob/:id' , async(req,  res) =>{
            const id =  req.params.id;
            console.log(id);
            const body =  req.body;
            const filter = { _id : new ObjectId(id)};
            const updateDoc = {
                $set : {
                    title : body.title,
                    status : body.status
                }
            }
            const result =  await jobsPortalCollection.updateOne(filter , updateDoc);
            res.send(result)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Jobs portal is running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
