const express = require('express');
const app = express();
const cors =  require('cors');
var admin = require("firebase-admin");
require('dotenv').config();

const {MongoClient} = require('mongodb');
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

const serviceAccount= JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
// const serviceAccount= require('./appointlet-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6w1pi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true});



async function verifyToken(req, res, next){
  if(req.headers?.authorization?.startsWith('Bearer ')){
    const token = req.headers.authorization.split(' ')[1];

    try{
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    }

    catch{

    }
  }
  next();
}
// console.log(uri)
async function run() {
    try {
        await client.connect();
        const database = client.db('appointlet');
        const appointmentsCollection = database.collection('appointments');
        const usersCollection = database.collection('users');

        app.get('/appointments', async (req, res)=>{
          const email = req.query.email;
          const date = new Date(req.query.date).toLocaleDateString();
          // const date = req.query.date.toString();
          const query = {email: email, date: date}
          console.log(query);
          const cursor = appointmentsCollection.find(query);
          const appointments = await cursor.toArray();
          res.json(appointments);
        })
        //appointments
        app.post('/appointments', verifyToken, async (req, res) => {
          const appointment = req.body;
          const result = await appointmentsCollection.insertOne(appointment);
          console.log(result);
          // res.json({message: 'hello app'})
          res.json(result)
        });

        //users
        app.post('/users', async (req, res) => {
          const user = req.body;
          const result = await usersCollection.insertOne(user);
          console.log(result);
          res.json(result)
        });

        
        //upsert google users
        app.put('/users', async(req,res) =>{
          const user = req.body;
          const filter = {email: user.email};
          const options = {upsert: true};
          const updateDoc = {$set: user};
          const result = await usersCollection.updateOne(filter, updateDoc, options);
          res.json(result);
        });

        //admin role
        app.put('/users/admin', verifyToken, async (req,res) => {
          const user = req.body;
          console.log('decodedEmail:', req.decodedEmail);
          const requester= req.decodedEmail;
          if(requester){
            const requesterAccount = await usersCollection.findOne({email: requester});
            if(requesterAccount.role === 'admin'){
              const filter = {email: user.email};
          const updateDoc = {$set: {role: 'admin'}};
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
            }
          }

          else{
            res.status(403).json({message:"You do not have access tyo make an Admin"})//http status code
          }
        })

        //admin dashboard
        app.get('/users/:email', async(req, res) => {
          const email = req.params.email;
          const query = {email: email};
          const user = await usersCollection.findOne(query);
          let isAdmin = false;
          if(user?.role === 'admin'){
            isAdmin = true;
          }
          res.json({admin: isAdmin});
        })


    }
    finally{
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Appointlet is running!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})




        // app.get('/users');
        // app.get('/users/:id');

        // app.post('/users');

        // app.delete('/users/:id');

        // app.put('/users/:id');