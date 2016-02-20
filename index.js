'use strict';
global.Promise = require("promise");
const express = require("express");
const bodyParser = require('body-parser');

class AppStack {

    utf8middleware(req, res, next) {
        const contentType = req.get("content-type");
        if (contentType) {
            req.headers["content-type"] = contentType.replace("utf8", "utf-8");
        }
        next();
    }
    get proxy() {
        return require("./controllers/proxy");
    }
    get batch() {
        return require("./controllers/batch");
    }
    get user() {
        return require("./controllers/user");
    }
    get classes() {
        return require("./controllers/classes");
    }
    get installations() {
        return require("./controllers/installations");
    }
    get roles() {
        return require("./controllers/roles");
    }
    get schema() {
        return require("./controllers/schema");
    }
    get files() {
        return require("./controllers/files");
    }
    get events() {
        return function(req, res){
            res.send({});
        };
    }
    get admin() {
        const admin = express();
        admin.use(this.authentication.userAuth);
        admin.use("/apps", this.apps);
        return admin;
    }
    get apps() {
        return require("./controllers/apps");
    }
    get authentication() {
        return require("./controllers/authentication");
    }

    get createApp() {
        const app = express();
        const stack = this;
        const authentication = this.authentication;

        app.use(function(req, res, next){
            const contentType = req.get("content-type");
            if (contentType) {
                req.headers["content-type"] = contentType.replace("utf8", "utf-8");
            }
            next();
        });
        app.use(bodyParser.json()); // for parsing application/json
        app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

        app.use(function(req, res, next){
            req._AppStack = {db:{}, stats: {start: new Date() }};
            next();
        });


        app.use(authentication.clientAuth);

        // Proxy for disguised GETs in POSTs
        app.use(stack.proxy);

        // Batch endpoint
        app.use("/batch", stack.batch);

        // All User related enpoints
        app.use(stack.user);

        // All Classes related endpoints
        app.use("/classes", stack.classes);

        // Installations
        app.use("/installations", stack.installations);

        // Roles
        app.use("/roles", stack.roles);

        // Schema
        app.use("/schema", stack.schema);

        // Files
        app.use("/files", stack.files);

        // Event tracking // does nothing
        app.use("/events", stack.events);

        app.use(function(req, res, next){
            const startTime = req._AppStack.stats.start.getTime();
            const endTime = new Date().getTime();
            console.log("Processed!", endTime - startTime);
            next();
        });

        app.use(stack.admin);
        return app;
    }

    get app() {
        if (!this._app) {
            this._app = this.createApp();
        }
        return this._app;
    }
}

module.exports = AppStack;