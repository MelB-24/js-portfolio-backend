const express = require("express")
const multer = require("multer")
const AWS = require("aws-sdk")
const fs = require("fs")
const mongoose = require("mongoose")
const cors = require("cors")
const nodemailer = require("nodemailer")
require("dotenv").config()

const Project = require("./models/project")

const app = express()
const PORT = process.env.PORT || 5000

app.use(express.json())
app.use(cors())

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    },
})

const upload = multer({ storage: storage })

AWS.config.update({
    accessKeyId: process.env.IAM_ACCESS_ID,
    secretAccessKey: process.env.IAM_SECRET,
    region: "ap-southeast-2",
})

const s3 = new AWS.S3()

mongoose.connect(
    process.env.DB_URL,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (err) => {
        if (err) {
            console.log(`Error from MongoDB: ${err}`)
        } else {
            console.log("Connected to MongoDB")
        }
    }
)

// PROJECTS
app.get("/projects", (req, res) => {
    Project.find().then((project) => {
        res.json(project)
    })
})

app.post("/new-project", (req, res) => {
    const { title, languages, githubLink, url, photoUrl } = req.body

    Project.create({ title, languages, githubLink, url, photoUrl }).then(
        (project) => {
            res.json(project)
        }
    )
})

// app.delete('')

// IMAGES

app.post("/post_file", upload.single("demo_file"), (req, res) => {
    uploadFile(req.file.path, req.file.filename, res)
})

app.get("/get_file/:file_name", (req, res) => {
    retrieveFile(req.params.file_name, res)
})

app.listen(PORT, console.log(`Listening on http://localhost:${PORT}`))

function uploadFile(source, targetName, res) {
    console.log("preparing to upload...")
    fs.readFile(source, (err, filedata) => {
        if (!err) {
            const putParams = {
                Bucket: "portfolio-images-2410",
                Key: targetName,
                Body: filedata,
            }

            s3.putObject(putParams, (err, data) => {
                if (err) {
                    console.log("Could not upload the file. Error :", err)
                    return res.send({ success: false })
                } else {
                    console.log("Successfully uploaded the file")
                    return res.send({ success: true })
                }
            })
        } else {
            console.log({ err: err })
        }
    })
}

function retrieveFile(filename, res) {
    const getParams = {
        Bucket: "portfolio-images-2410",
        Key: filename,
    }

    s3.getObject(getParams, function (err, data) {
        if (err) {
            return res.status(400).send({ success: false, err: err })
        } else {
            return res.send(data.Body)
        }
    })
}

var transport = {
    host: "smtp.gmail.com",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
}

var transporter = nodemailer.createTransport(transport)

transporter.verify((error, success) => {
    if (!error) {
        console.log("Server is ready to take messages")
    } else {
        console.log(error)
    }
})

app.post("/send", (req, res, next) => {
    const { name, email, message } = req.body

    var content = `name: ${name} \n email: ${email} \n message: ${message} `

    var mail = {
        from: name,
        to: "melissabykersma@gmail.com",
        subject: "New Message from Contact Form",
        text: content,
    }

    transporter.sendMail(mail, (err, data) => {
        if (err) {
            res.json({
                msg: "fail",
            })
        } else {
            res.json({
                msg: "success",
            })
        }
    })
})
