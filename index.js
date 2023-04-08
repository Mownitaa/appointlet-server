const express = require('express');
const app = express();
const cors =  require('cors');
require('dotenv').config();

const {MongoClient} = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
///
app.use(express.static('public'))
///

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6w1pi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true});

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
          console.log("hello", date);
          const query = {email: email, date: date}
          console.log(query);
          const cursor = appointmentsCollection.find(query);
          const appointments = await cursor.toArray();
          res.json(appointments);
        })
        //appointments
        app.post('/appointments', async (req, res) => {
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
        app.put('/users/admin', async (req,res) => {
          const user = req.body;
          console.log('put', user);
          const filter = {email: user.email};
          const updateDoc = {$set: {role: 'admin'}};
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
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