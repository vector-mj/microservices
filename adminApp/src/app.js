const express = require('express')
const redis = require('redis')
const app = express()
const { randomBytes } = require('crypto')
const morgan = require('morgan')

// Redis Connection 
const Client = redis.createClient({
    host: 'admin-db', // service name in kubernetes
    port: 6379
})
console.log('Redis is running')

// Body requests
app.use(express.json())
// For log requests
app.use(morgan('combined'))

// Services port
const port = process.env.ADMINPORT || 8081

// Root route
app.get('/', (req, res) => {
    res.send('Hi Admin')
})

// Show all users
app.get('/users', (req, res) => {
    try {
        Client.HGETALL("users", (err, reply) => {
            if (err || reply == null) {
                res.send({
                    message: "Not Found"
                })
            } else {
                res.send({
                    count: Object.keys(reply).length,
                    users: reply
                })
            }
        })

    } catch (err) {
        res.send("Not found")
    }
})

// Showing that user exist or not
// respones = user info (username,passowrd,rfid,create time)
app.post('/exists', (req, res) => {
    const { rfid } = req.body;
    if (!rfid) {
        res.send({
            message: "Bad request"
        })
    } else {
        Client.hget("users", rfid, (err, reply) => {
            if (err || reply == null) {
                res.send({
                    message: "User not found"
                })
            } else {
                let createdAt = new Date(parseInt(rfid.split('-')[0])).toISOString()
                res.send({
                    createdAt: createdAt,
                    id: rfid,
                    user: JSON.parse(reply)
                })
            }
        })
    }
})

// Create user with username,password
// Response = user rfid
app.post('/create', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.send({
            Error: "we need username and password to create user"
        })
    } else {
        const rfid = `${Date.now()}-${randomBytes(4).toString('hex')}`
        Client.hset("users", rfid, JSON.stringify({ username: username, password: password }))
        return res.send({
            message: "User created successfully",
            username: rfid
        })
    }
})

app.listen(port, () => {
    console.log(`Admin server is running on port ${port}`)
})