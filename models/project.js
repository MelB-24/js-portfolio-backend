const mongoose = require("mongoose")

const ProjectSchema = new mongoose.Schema({
    title: String,
    languages: Array,
    githubLink: String,
    url: String,
    photoUrl: String,
})

module.exports = mongoose.model("Project", ProjectSchema)
