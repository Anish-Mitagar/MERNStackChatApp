import express from 'express'
import mongoose from 'mongoose'
import Messages from "./dbMessages.js"
import Pusher from 'pusher'
import cors from 'cors'

const app = express()
const port = process.env.PORT || 3000

const pusher = new Pusher({
    appId: "1248809",
    key: "4ff174e122389c3e4450",
    secret: "5ede18c56742bed31d99",
    cluster: "mt1",
    useTLS: true
});



app.use(express.json())
app.use(cors())

const connection_url = 'mongodb+srv://admin:EngineerLife@cluster0.zvr9x.mongodb.net/chatappDatabase?retryWrites=true&w=majority';

mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection

db.once('open', ()=>{
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change)=>{
        console.log("A Change occured", change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received,
                }
            );
        } else {
            console.log('Error triggering Pusher')
        }
    });
});

app.get('/',(req, res)=>res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {

    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})

app.listen(port, ()=>console.log(`Listening on localhost:${port}`));