const express = require('express');
const cors=require('cors');
const jwt=  require('jsonwebtoken');
const cookieParser= require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app=express();
const port= process.env.PORT || 5000;


// middleware

// app.use(cors({
//   origin: [
//     'http://localhost:5173'
//   ],
//   credentials: true
// }));

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ph-assignment11-6c711.web.app",
      "https://ph-assignment11-6c711.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cxnpdhc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// middlewares

const logger=(req, res, next)=>{
  console.log('log info:',req.method, req.url)
  next()
}

const verifyToken=(req, res, next)=>{
  const token= req?.cookies?.token;
  console.log('token in the middleware',token);
  if(!token){
    return res.status(401).send({message: 'Unauthorized access'})
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err, decoded)=>{
    if(err){
      return res.status(401).send({message: 'Unauthorized access'})
    }
    req.user= decoded;
    next();
  })
 
}


const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  secure: process.env.NODE_ENV === "production" ? true: false,
};


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const featureCollection=client.db('assignmentManage').collection('features');
    const assignmentCollection=client.db('assignmentManage').collection('assignments');
    const submissionCollection=client.db('assignmentManage').collection('submission');


    app.get('/features',async(req,res)=>{
      const cursor=featureCollection.find();
      const result= await cursor.toArray();
      res.send(result);
    })


    



  app.get('/submitted',async(req,res)=>{
    const cursor=submissionCollection.find();
    const result= await cursor.toArray();
    res.send(result);
  })




app.get('/pending',logger,verifyToken, async (req, res) => {

  try {
    const status = req.query.status;
    const query = { status: status };
    const result = await submissionCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




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
    
    app.get('/myassignments/:userEmail',logger,verifyToken, async (req, res) => {
      const userEmail = req.params.userEmail;
   
      if(req.user.email !== userEmail){
        return res.status(403).send({message: 'forbidden access'})
      }
      try {
    
        const pendingRequests = await submissionCollection.find({
          userEmail: userEmail,
        }).toArray();
    
        res.json(pendingRequests);
      } catch (error) {
        console.error('Error retrieving pending requests:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });


    
  // auth related api

  app.post('/jwt',logger,async(req,res)=>{
    const user= req.body;
    console.log('user for token',user)
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn : '4h'})
    res.cookie('token',token,cookieOptions

    )
    .send({success: true});
  })



    app.post('/logout', async(req, res)=>{
      const user= req.body;
      console.log('logging out', user);
      res.clearCookie('token',{...cookieOptions,maxAge:0}).send({success: true})
    })



    app.post('/assignments',logger,verifyToken, async(req, res) => {
      const newAssignment=req.body
     
      const result=await assignmentCollection.insertOne(newAssignment)
      res.send(result)
    })
    app.post('/submission',logger,verifyToken, async(req, res) => {
      const newSubmission=req.body
      const result=await submissionCollection.insertOne(newSubmission)
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
    app.patch('/marked/:id',logger,verifyToken, async(req,res)=>{
      const id= req.params.id;
      const filter={_id: new ObjectId(id)};
      const updatedmark = req.body;
    
      const updateDoc={
              $set:{
             ...updatedmark
               
              },
      }
      const result=await submissionCollection.updateOne(filter,updateDoc)
      res.send(result)
    })
   
    app.delete('/assignments/:id',logger,verifyToken,async(req,res)=>{
      const id= req.params.id;
      const query={_id:new ObjectId(id)};
      const result= await assignmentCollection.deleteOne(query);
      res.send(result)
    })





    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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