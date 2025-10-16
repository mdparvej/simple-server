const express = require('express');
const cors =require('cors');
const app = express();
const port  = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

//middle ware
app.use(cors());
app.use(express.json());
//mongodb

const uri = `mongodb+srv://${process.env.BD_USER}:${process.env.BD_PASSWORD}@cluster0.qj5o1cz.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

function verifyJWT(req,res,next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send('Unauthorized Access')
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function(err,decoded){
    if(err){
      return res.status(403).send({message : 'forbidden access'})
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    const doctorService = client.db('doctor').collection('appointment');
    const bookingCollection = client.db('doctor').collection('bookings');
    const userCollection = client.db('doctor').collection('user');
    const doctorCollection = client.db('doctor').collection('doctors');
    //NOTE: make sure you use verifyAdmin after verifyJWt
    const verifyAdmin = async (req,res,next) => {
      const decodedEmail = req.decoded.email;
      const query = {email : decodedEmail};
      const user = await userCollection.findOne(query);
      if(user?.role !== 'admin'){
        return res.status(403).send({message: 'forbidden access'})
      }
      next();
    }
    //user aggregate to qu


    app.get('/doctor',async (req,res) => {
        const date = req.query.date;
        console.log(date);
        const query = {};
        const cursor = doctorService.find(query);
        const service = await cursor.toArray();
        const bookingQuery = {appointmenteDate : date};
        const alradyBooked = await bookingCollection.find(bookingQuery).toArray();
        service.forEach(option => {
          const optionBooked = alradyBooked.filter(book => book.treatment === option.name);
          const bookedSlots = optionBooked.map(book => book.slot);
          const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
          option.slots = remainingSlots;

        })
        res.send(service)

    });
    app.get('/bookings',verifyJWT, async(req,res) => {
      const email =req.query.email;
      const decodedEmail = req.decoded.email;

      if(email !== decodedEmail){
        return res.status(403).send({message : 'forbidden access'})
      }

      const query = {email: email}; 
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    })
    app.post('/bookings', async(req,res) => {
      const booking  = req.body;
      const query = {
        appointmenteDate: booking.appointmenteDate,
        
      }
      const alradyBooked = await bookingCollection.find(query).toArray();

      if(alradyBooked.length){
        const message = `you already have a booking on ${booking.appointmenteDate}`;
        return res.send({acknowledged: false, message})
      }

      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });
    app.get('/bookings', async(req,res) => {
      const query = {};
      const cursor = bookingCollection.find(query);
      const service = await cursor.toArray();
      res.send(service);
    });
    app.get('/bookings/:id', async(req,res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const service = await bookingCollection.findOne(query);
      res.send(service);
    })
    /*
      API Namings consvention
      app.get('/bookings')
      app.get('/bookings/:id)
      app.post('/bookings')
      app.patch('/bookings/:id')
      app.delete('/bookings/:id)
    */
   app.get('/jwt', async(req,res) => {
    const email = req.query.email;
    const query = {email : email};
    const user = await userCollection.findOne(query);
    console.log(user);
    if(user){
      const token = jwt.sign({email}, process.env.ACCESS_TOKEN,{expiresIn: '1h'});
      return res.send({accessToken : token})
    }
    res.status(403).send({accessToken: ''})
   });
   app.get('/users', async(req,res) => {
      const query = {};
      const users = await userCollection.find(query).toArray();
      res.send(users);
   })

   app.get('/users/admin/:email',async(req,res)=> {
      const email = req.params.email;
      const query = {email};
      const user = await userCollection.findOne(query);
      res.send({isAdmin : user?.role === 'admin'})
       
   })

   app.put('/users/admin/:id',verifyJWT, async(req,res) => {
      const decodedEmail = req.decoded.email;
      const query = {email : decodedEmail};
      const user = await userCollection.findOne(query);
      if(user?.role !== 'admin'){
        return res.status(403).send({message: 'forbidden access'})
      }

      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const options = {upsert : true};
      const newDoc = {$set: {role: 'admin'}};

      const result = await  userCollection.updateOne(filter,newDoc,options);
      res.send(result);

   });
    app.post('/users', async (req,res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get('/appointmentspecialty', async(req,res) => {
      const query = {};
      const result = await doctorService.find(query).project({name:1}).toArray();
      res.send(result);
    });
    app.get('/addprice', async(req,res) => {
      const filter = {};
      const options ={upsert : true};
      const updateDoc = {$set : {price : 50}};
      const result = await doctorService.updateMany(filter,updateDoc,options);
      res.send(result);
    })


    app.post('/addDoctor',verifyJWT,verifyAdmin,async (req,res) => {
      const doctor = req.body;
      const result = doctorCollection.insertOne(doctor);
      res.send(result);
    });
    app.get('/addDoctor',verifyJWT,verifyAdmin,async (req,res) => {
      const query = {};
      const result = await doctorCollection.find(query).toArray();
      res.send(result);
    });
    app.delete('/deleteDoctor/:id',async (req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await doctorCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
   
  }
}
run().catch(console.dir);



app.get('/',(req,res) => {
    res.send('Doctor portal is runing')
});
module.exports = app;