const express = require('express')
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3000
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lwsgehv.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();
    const petCollection = client.db("petAdoption").collection("allPet")
    const userCollection = client.db("petAdoption").collection("user")
    const adoptReqCollection = client.db("petAdoption").collection("adoptReq")
    const CampaignInfoCollection = client.db("petAdoption").collection("campaignInfo")
    const donationInfoCollection = client.db("petAdoption").collection("donationInfo")

    // middleware

    const verifyToken = (req, res, next) => {
      // console.log('inside verify token',req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" })
        }
        req.decoded = decoded
        next()
      })
    }

    // verified admin 
    // user verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email
      const query = { email: email }
      const user = await userCollection.findOne(query)
      const isAdmin = user?.role === 'admin'
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next()
    }

    // pet added using POST API.
    app.post('/addPet', async (req, res) => {
      const pets = req.body
      const result = await petCollection.insertOne(pets)
      res.send(result)
    })
 
    // all pet getting
    app.get('/addPet', async (req, res) => {
      const result = await petCollection.find().toArray()
      res.send(result)
    })
  
    // specific pet get
    app.get('/addPet/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await petCollection.findOne(query)
      res.send(result)
    })

    // user request info post for pet adoption 
    app.post('/adoptReq', async (req, res) => {
      const request = req.body
      const result = await adoptReqCollection.insertOne(request)
      res.send(result)
    })

  // user request info get
   app.get('/adoptReq',async(req,res)=>{
     const result = await adoptReqCollection.find().toArray()
     res.send(result)
   })

  // user request accepted  by patch. a

  app.patch('/adoptReq/:id', async (req, res) => {
    const userId = req.params.id
    const filter = { _id: new ObjectId(userId) }
    const updateDoc = {
      $set: {
        accept: true
      }
    }
    const result = await adoptReqCollection.updateOne(filter, updateDoc)
    res.send(result)
  })

  // user request rejected by put. 

  app.put('/adoptReq/:id', async (req, res) => {
    const petId = req.params.id
    const rejectAdopt = req.body
    const filter = { _id: new ObjectId(petId) }
    const updateDoc = {
      $set: {
        accept : rejectAdopt.accept
      }
    }
    const result = await adoptReqCollection.updateOne(filter, updateDoc)
    res.send(result)
  })
  
  // user adoption request deleted if you can.
   
  app.delete('/adoptReq/:id',async(req,res)=>{
    const id = req.params.id
    const query = {_id : new ObjectId(id)}
    const result = await adoptReqCollection.deleteOne(query)
    res.send(result)
  })

  //  pets are delete for admin user.
  app.delete('/addPet/:id',async(req,res)=>{
    const id = req.params.id
    const query = {_id : new ObjectId(id)}
    const result = await petCollection.deleteOne(query)
    res.send(result)
  })
   
  // update pet of user.
  app.patch('/addPet/:id',async(req,res)=>{
    const id = req.params.id
    const pets = req.body
    const filter = {_id : new ObjectId(id)}
    const updateDoc = {
     $set: {
      petName : pets.petName,
      petAge : pets.petAge,
      petLocation : pets.petLocation,
      category :  pets.category,
      petOwnerInfo : pets.petOwnerInfo,
      petDescription : pets.petDescription,
      image : pets.image
     },
   };
   const updatedPetInfo = await petCollection.updateOne(filter,updateDoc)
   res.send(updatedPetInfo)
  })

    // admin any pet doing adopted (false => true).
    app.put('/addPet/:id', async (req, res) => {
      const petId = req.params.id
      const updatedAdopt = req.body
      const filter = { _id: new ObjectId(petId) }
      const updateDoc = {
        $set: {
          adopted : updatedAdopt.adopted 
        }
      }
      const result = await petCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

  // donation campaign information post.
  app.post('/addCampaign',async(req,res)=>{
     const campaignInfo = req.body
     const result = await CampaignInfoCollection.insertOne(campaignInfo)
     res.send(result)
  })

  // get donation campaign which is created 
  app.get('/addCampaign',  async(req,res)=>{
     const result = await CampaignInfoCollection.find().toArray()
     res.send(result) 
  })    
    // donation campaign updated using patch

  app.patch('/addCampaign/:id',async(req,res)=>{
    const id = req.params.id
    const donation = req.body
    const filter = {_id : new ObjectId(id)}
    const updateDoc = {
    $set: {
      petName : donation.petName, 
      donationAmount : donation.donationAmount,
      lastDate : donation.lastDate,
      shortInfo : donation.shortInfo,
      longInfo : donation.longInfo,
      image : donation.image
     },
   };
   const donationInfoUpdate = await CampaignInfoCollection.updateOne(filter,updateDoc)
   res.send(donationInfoUpdate)
  })

  // delted campaign by admin 

  app.delete('/addCampaign/:id', async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await CampaignInfoCollection.deleteOne(query)
      res.send(result)
  })

  // specefic donation campaign collect.
  app.get('/addCampaign/:id',async(req,res)=>{
    const id = req.params.id
    const query = {_id : new ObjectId(id)}
    const result = await CampaignInfoCollection.findOne(query)
    res.send(result)
  })

  app.put('/addCampaign/:id', async (req, res) => {
    const campaignId = req.params.id
    const filter = { _id: new ObjectId(campaignId) }
    const updateDoc = {
      $set: {
        paused : false,
      }
    }
    const result = await CampaignInfoCollection.updateOne(filter, updateDoc)
    res.send(result)
  })

 
  

  // donated user information post.
  app.post('/donationUser',async(req,res)=>{
    const donatedUserInfo = req.body 
    const result = await donationInfoCollection.insertOne(donatedUserInfo)
    res.send(result)
  })

  app.get('/donationUser', async(req,res)=>{
    const result = await donationInfoCollection.find().toArray()
    res.send(result)
  })
 
    app.post('/user', async (req, res) => {
      const user = req.body;
      // insert email if user doesn't exits.
      // simple checking  
      const query = { email: user.email }
      const exitingUser = await userCollection.findOne(query)
      if (exitingUser) {
        return res.send({ message: 'user already exits', insertedId: null })
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

    // get all logged in user
    app.get('/user', verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    // get admin role
    app.get('/user/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" })
      }
      const query = { email: email };
      const user = await userCollection.findOne(query)
      let admin = false
      if (user) {
        admin = user?.role === 'admin'
      }
      res.send({ admin })
    })

    // create user admin
    app.patch('/user/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const userId = req.params.id
      const filter = { _id: new ObjectId(userId) }
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // jwt related api 
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' })
      res.send({ token })
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


app.get('/', (req, res) => {
  res.send('pet adoption server is running...')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})