global.Promise = require("promise");

const express = require('express');
const app = express();

const AppStack = require("./index");

const stack = new AppStack();

app.use("/1", stack.app);

app.listen(process.env.PORT || 5000);

const Application = require("./models/Application");
const app = new Application({applicationId: "12345", clientKey: "12345"});
app.save();