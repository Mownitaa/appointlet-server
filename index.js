const express = require('express');
const app = express();
const cors =  require('cors');
require('dotenv').config();

const {MongoClient} = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6w1pi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true});

// console.log(uri)
async function run() {
    try {
        await client.connect();
        const database = client.db('appointlet');
        const appointmentsCollection = database.collection('appointments');

        app.get('/appointments', async (req, res)=>{
          const email = req.query.email;
          const date = req.query.date;
          console.log("hello")
          console.log("hello", date);
          const query = {email: email}
          console.log(query);
          const cursor = appointmentsCollection.find(query);
          const appointments = await cursor.toArray();
          res.json(appointments);
        })

        app.post('/appointments', async (req, res) => {
          const appointment = req.body;
          const result = await appointmentsCollection.insertOne(appointment);
          console.log(result);
          // res.json({message: 'hello app'})
          res.json(result)
        });


    }
    finally{
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello Appointlet!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})




        // app.get('/users');
        // app.get('/users/:id');

        // app.post('/users');

        // app.delete('/users/:id');

        // app.put('/users/:id');