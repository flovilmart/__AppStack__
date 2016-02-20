'use strict';
const _ = require("underscore");
const Query = require("../../models/Query");
const Relation = require("../../models/Relation");

class QueriesController {
    constructor(className, state) {
        this.className = className;
        this.state = state;
        this.applicationId = state.applicationId;
        this.db = state.db[this.applicationId];
        this.userId = state.userId;
        this.roles = state.roles;
        this.useMasterKey = state.useMasterKey;
        this.includes = [];
        this.isCount = false;
    }
    include(includes) {
        this.includes = includes;
        return this;
    }
    count() {
        this.isCount = true;
        return this;
    }

    find(query, options, sort, limit, skip) {

        if (arguments.length == 1 && _.isObject(query.query)) {
            const queryOptions = query;
            query = queryOptions.query;
            options = queryOptions.projection;
            sort = queryOptions.sort;
            limit = queryOptions.limit;
            skip = queryOptions.skip;
            this.includes = queryOptions.includes;
            this.isCount = queryOptions.count;
        }
        options = options || {};
        
        options._id = 0;
        if (this.className == "_User") {
            options.password = 0;
        }
        
        sort = sort || {"updatedAt" : -1};
        limit = limit || 100;
        skip = skip || 0;
        const self = this;

        return self.prepareQuery(query).then(function(query){

            const ACLQuery = new Query(self.userId, self.roles, self.useMasterKey);
            query = ACLQuery.readQuery(query);
            return new Promise(function(resolve, reject){

                const c = self.db.collection(self.className).find(query, options).sort(sort).skip(skip).limit(limit);
                if (self.isCount) {
                    c = c.count(function(err, res){
                        return resolve(res);
                    });
                }else{
                    c.toArray(function(err, res){
                        if (err) { return reject(err); }
                        return resolve(res);
                    });
                }
            });
        }).then(function(queryResult){
            if (self.isCount) {
                return Promise.resolve(queryResult);
            }
            return self.resolveIncludes(queryResult);
        });
    }
    prepareQuery(query) {
        const self = this;
        //var state = this.state;
        const queries = Object.keys(query).filter(function(key){
            const component = query[key];
            return _.isObject(component) || key == "$relatedTo";
        }).map(function(key){
            const component = query[key];
            // {"$inQuery":
            //  {"where":
            //      {"image":{"$exists":true}
            //  },
            //  "className":"Post"
            // }
            let where;
            let className;
            let notIn;
            //var relatedTo;
            let comparisonKey;
            let finalKey = key;
            //var projection = {};
            let forceMasterKey = false;
            let mapper;
            if (component.$inQuery) {

                where = component.$inQuery.where;
                className = component.$inQuery.className;
                comparisonKey = "objectId";
                finalKey = `${key}.objectId"`;

            }else if(component.$notInQuery) {

                where = component.$notInQuery.where;
                className = component.$notInQuery.className;
                comparisonKey = "objectId";
                notIn = true;
                finalKey = `${key}.objectId"`;

            }else if(component.$select) {

                const select = component.$select;
                className = select.query.className;
                where = select.query.where;
                comparisonKey = select.key;

            }else if(key == "$relatedTo") {
            
                comparisonKey = "parent";
                finalKey = "objectId";

                const obj = component.object;
                className = Relation.name(obj.className, self.className);
                where = {"parent.objectId": obj.objectId, key:component.key};
                forceMasterKey = true;
                mapper = function(o){
                    return o.to.objectId;
                };
            }
            if (_.isUndefined(where) || _.isUndefined(className)) {
                return Promise.resolve();
            }

            const ctrl = new QueriesController(className, self.state);
            if (forceMasterKey) {
                ctrl.forceMasterKey = true;
            }
            mapper = mapper || function(o){ return  o[comparisonKey]; } ;
            return (function(key, comparisonKey, finalKey){
                console.log(key, comparisonKey, className, finalKey, where);
                return ctrl.find(where).then(function(objects) {
                    const values = objects.map(mapper);
                    delete query[key];
                    // if (values.length == 0) {
                    //  console.log("No matching objects");
                    //  return;
                    // };
                    console.log(values);
                    if (notIn) {
                        query[finalKey] = {$nin: values };
                    }else{
                        query[finalKey] = {$in: values };
                    }
                    
                    return Promise.resolve();
                });

            })(key, comparisonKey, finalKey);
            
        });
        if (queries.length > 0) {
            return Promise.all(queries).then(function(){
                return Promise.resolve(query);
            });
        }

        return Promise.resolve(query);
    }
    hasIncludes() {
        return _.isUndefined(this.includes) || this.includes.length === 0;
    }
    resolveIncludes(objects) {
        const self = this;
        if (!this.hasIncludes()) {
            return Promise.resolve(objects);
        }
        // TODO: dot notation for includes;
        const fetches = {};
        const includes = this.includes;
        const includesForClass = objects.reduce(function(obj, object){
            return includes.reduce(function(includesMap, key){
                const keys = key.split(".");
                key = keys[0];
                const pointer = object[key];
                if (_.isObject(pointer) && pointer.className && pointer.objectId) {
                    const list = fetches[pointer.className] || [];
                    list.push(pointer.objectId);
                    fetches[pointer.className] = list;
                    if (keys.length > 1) {
                        includesMap[pointer.className] = keys.slice(1, keys.length).join(".");
                    }
                }
                return includesMap;
            }, obj);
        }, {});

        const classes = Object.keys(fetches);

        const queries = classes.map(function(className){
            const ctrl = new QueriesController(className, self.state);
            ctrl.include(includesForClass[className]);
            ctrl.useMasterKey = self.useMasterKey;
            const ors = fetches[className].map(function(objectId){ 
                return { objectId: objectId };
            });
            return ctrl.find({$or: ors});
        });

        return Promise.all(queries)
        .then(function(results){

            const objectMap = results.reduce(function(objectMap, result, i){
                const className = classes[i];
                objectMap[className] = objectMap[className] || {};
                return result.reduce(function(map, o){
                    map[className][o.objectId] = o;
                }, objectMap);
            }, {});

            return Promise.resolve(objects.map(function(object){
                return includes.reduce(function(object, key){
                    key = key.split(".")[0];
                    const pointer = object[key];
                    const foundObject = objectMap[pointer.className][pointer.objectId];
                    // Sometimes we don't find because of ACL's
                    if (foundObject) {
                        foundObject.__type = "Object";
                        foundObject.className = pointer.className;
                        object[key] = foundObject;
                    }
                }, object);
            }));

            return Promise.resolve(objects);
        }).catch(function(err){
            console.error(err);

        });
    }

    insert(query, object) {
        const collection = this.db.collection(this.className);
        return new Promise(function(resolve, reject){
            collection.update(query, object,{upsert:true}, function(err){
                if (err) { return reject(err); }
                return resolve(object);
            });
        });
    }

    update (query, object) {
        
        const ACLQuery = new Query(this.userId, this.roles, this.useMasterKey);
        query = ACLQuery.writeQuery(query);
        const collection = this.db.collection(this.className);
        return new Promise( function(resolve, reject) {
            collection.update(query, object, {upsert:false}, function(err, result){
                if (err) { return reject(err); }
                if (result.result.nModified === 0) { return reject({"code": 101, 'error':"Object not found for update"}); }
                return resolve(result);
            });
        });
    }

    delete(query) {
        if (Object.keys(query).length === 0) {
            return Promise.reject("Cannot delete all");
        }

        const ACLQuery = new Query(this.userId, this.roles, this.useMasterKey);
        query = ACLQuery.writeQuery(query);
        const collection = this.db.collection(this.className);
        return new Promise( function(resolve, reject) {
            collection.remove(query, {justOne: true}, function(err, result){
                if (result.result.n == 1) {
                    return resolve(result);
                }
                return reject(err);
            });
        });
    }
}

const toTree = function(string) {
    const tree = {};
    const e = string.split(".");
    if (e.length == 1) {
        tree[e[0]] = true;
    }else{
        tree[e[0]] = toTree(e.slice(1, e.length).join("."));
    }

    return tree;
};


module.exports = QueriesController;