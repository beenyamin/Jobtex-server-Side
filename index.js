const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')

const app = express();
const port = process.env.PORT || 5000;


app.use(cors({
    origin: [
        // 'http://localhost:5173',
    'https://assignment-11-e300a.web.app',
    'https://assignment-11-e300a.firebaseapp.com',
    
    ],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.otrke0o.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// verifyToken
const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log('value of token in middleware:', token)
    if (!token) {
        return res.status(401).send({ massage: 'not authorized' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {

        if (err) {
            console.log(err)
            return res.status(401).send({ massage: 'unauthorized' })
        }
        console.log('value in the token', decoded)
        req.user = decoded;
        next()
    })

}




async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const jobCollection = client.db('jobtexDB').collection('job');



        // auth related api
        app.post('/user', async (req, res,) => {
            const user = req.body;
            // console.log(req.cookies.token)
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res
                .cookie('token', token, {
                    httpOnly: true ,
                    secure: true ,
                    sameSite: 'none'
                })
                .send({ success: true })
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })



        // Job post api
        app.post('/jobPosts', async (req, res) => {
            const jobs = req.body;
            console.log(jobs);
            const result = await jobCollection.insertOne(jobs);
            res.send(result);
        })


        app.get('/jobPosts', async (req, res) => {
            const cursor = jobCollection.find();
            const result = await cursor.toArray();
            res.send(result)


        })

        // my posted jobs

        app.get('/mypostedjobs', verifyToken, async (req, res) => {
            console.log('user in the valid token', req.user)
            if (req.query.email !== req.user.email) {
                return res.status(403).send({ massage: 'forbidden access kkkkkk' })
            }

            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await jobCollection.find(query).toArray();
            res.send(result)
        })

        app.delete('/job/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobCollection.deleteOne(query);
            res.send(result);
        })

        app.get('/allpost', async (req, res) => {
            const cursor = jobCollection.find();
            const result = await cursor.toArray();
            res.send(result)


        })


        app.get('/updatepost/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobCollection.findOne(query)
            res.send(result);
        })



        app.put('/updatepost/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedPost = req.body;
            const posts = {
                $set: {
                    jobTitle: updatedPost.jobTitle,
                    maximumPrice: updatedPost.maximumPrice,
                    minimumPrice: updatedPost.minimumPrice,
                    description: updatedPost.description,
                    date: updatedPost.date,
                    category: updatedPost.category,
                    email: updatedPost.email


                }
            }
            const result = await jobCollection.updateOne(filter, posts, options);
            res.send(result);
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
    res.send('SERVER IS RUNNING!');
});


app.listen(port, () => {
    console.log(`Assignment 11 Server is running on port ${port}`);
})
