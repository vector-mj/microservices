const express = require('express')
const app = express()
const { randomBytes } = require('crypto')
const axios = require('axios')
const redis = require('redis')
const { DH_CHECK_P_NOT_SAFE_PRIME } = require('constants')
const port = process.env.LOGPORT || 8082
const Client = redis.createClient({
    host: "localhost", // logdb-srv
    port: 6379
})

app.use(express.json())

app.get('/', (req, res) => {
    res.send('log app')
})

app.post("/gate", async (req, res) => {
    const { gtype, rfid } = req.body;
    if (!gtype || !rfid) {
        return res.send({
            message: "kind must be '1' or '0' "
        })
    }
    try {
        const result = await axios.post('http://localhost:8081/exists', { rfid: rfid }) // admin-srv
        if (result.data.user != null) {
            console.log(JSON.stringify({ rfid: rfid, time: new Date().toISOString(), type: gtype }))
            let d = new Date();
            let day = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
            Client.hset("logs", `${randomBytes(4).toString('hex')}-${rfid}`, JSON.stringify({ rfid: rfid, time: new Date().toISOString(), type: gtype }))
            if (gtype == "1") {
                Client.hget("login", `${day}.${rfid}`, (err, reply) => {
                    if (err || reply == null) {
                        console.log(`First login for ${rfid} in ${day}`)
                        Client.hset("login", `${day}.${rfid}`, JSON.stringify({ rfid: rfid, time: new Date().toISOString(), type: gtype }))
                    }
                })
            }
            return res.send({
                message: "Log created successfully"
            })
        } else {
            return res.send({
                message: "User not found"
            })
        }
    } catch (err) {
        return res.send("Try again later")
    }
})

app.get('/allLogs', (req, res) => {
    try {
        Client.hgetall("logs", (err, reply) => {
            if (err || reply == null) {
                return res.send("Log not found")
            } else {
                return res.send({
                    count: Object.keys(reply).length,
                    logs: reply
                })
            }
        })
    } catch (err) {
        return res.send({
            message: "Try again later"
        })
    }
})


app.get('/loginlogs', (req, res) => {
    try {
        Client.hgetall("login", (err, reply) => {
            if (err || reply == null) {
                return res.send("Log not found")
            } else {
                return res.send({
                    count: Object.keys(reply).length,
                    logs: reply
                })
            }
        })
    } catch (err) {
        return res.send({
            message: "Try again later"
        })
    }
})


app.listen(port, () => {
    console.log(`log app is running on port ${port}`)
})
