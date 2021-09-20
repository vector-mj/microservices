const express = require('express')
const app = express()
const axios = require('axios')
const port = process.env.INFOPORT || 8083;
const morgan = require('morgan')

// ** This service not used in kubernetes **

// For log requests
app.use(morgan('combined'))

// Showing all logs
app.get('/', async (req, res) => {
    try {
        const result = await axios('http://log-depl:8082/allLogs') //log-depl
        return res.send(result.data.logs)
    } catch (err) {
        return res.send(err)
    }
})
app.listen(port, () => {
    console.log(`info app is running on port ${port}`)
})