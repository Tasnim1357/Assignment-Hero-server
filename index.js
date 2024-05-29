const express = require('express');
const cors=require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app=express();
const port= process.env.PORT || 5000;


// middleware

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cxnpdhc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const featureCollection=client.db('assignmentManage').collection('features');
    const assignmentCollection=client.db('assignmentManage').collection('assignments');


    app.get('/features',async(req,res)=>{
      const cursor=featureCollection.find();
      const result= await cursor.toArray();
      res.send(result);
    })

    
    // app.get('/assignments',async(req,res)=>{
    //   const cursor=assignmentCollection.find();
    //   const result= await cursor.toArray();
    //   res.send(result);
    // })

    

    app.get('/assignments', async (req, res) => {
      try {
        const difficulty = req.query.difficulty;
        let query = {};
        if (difficulty && difficulty !== 'all') {
          query.difficulty = difficulty;
        }
        const assignments = await assignmentCollection.find(query).toArray();
        res.send(assignments);
      } catch (error) {
        res.status(500).json({ message: 'Server error', error });
      }
    });

    app.get('/assignments/:id',async(req,res)=>{
      const id= req.params.id;
      const query={_id: new ObjectId(id)}
      const result=await assignmentCollection.findOne(query)
      res.send(result);
    })
    
    


    app.post('/assignments', async(req, res) => {
      const newAssignment=req.body
     
      const result=await assignmentCollection.insertOne(newAssignment)
      res.send(result)
    })

    app.patch('/assignments/:id',async(req,res)=>{
      const item=req.body;
      const id= req.params.id;
      const filter={_id: new ObjectId(id)};
      const updatedDoc={
        $set:{
          title: item.title,
          description: item.description,
          marks: item.marks,
          image: item.image,
          difficulty: item.difficulty,
          date: item.date
        }
      }
      const result=await assignmentCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })






    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send('Assignment 11 server is running');
}) 

app.listen(port,()=>{
    console.log(`Assignment 11 server is running on port ${port}`)
})