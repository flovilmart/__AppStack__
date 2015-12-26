module.exports = Query = function(userId, roles, useMasterKey) {
	this.userId = userId;
	this.roles = roles;
	this.useMasterKey = useMasterKey;
};

var createSimpleRuleQuery = function(identifier, rw) {
	var q = {};
	q[`ACL.${identifier}.${rw}`] = true;
	return q;
};

var createOrRW = function(userId, roles, rw) {
	var queries = [];
	queries.push({"ACL": {$exists: false}});
	queries.push(createSimpleRuleQuery("*", rw));
	if (userId) {
		queries.push(createSimpleRuleQuery(userId, rw));
	}
	for(var i in roles) {
		queries.push(createSimpleRuleQuery("role:"+roles[i], rw));
	}
	return {$or:queries};
};

var createReadQuery = function(userId, roles) {
	return createOrRW(userId, roles, "read");
};

var createWriteQuery = function(userId, roles) {
	return createOrRW(userId, roles, "write");
};

Query.prototype.readQuery = function(originalQuery) {
	if (this.useMasterKey) {
		return originalQuery;
	}
	var q = createReadQuery(this.userId, this.roles);
	console.log(JSON.stringify(q));
	return {$and:[originalQuery, q]};
};

Query.prototype.writeQuery = function(originalQuery) {
	if (this.useMasterKey) {
		return originalQuery;
	}
	var q = createWriteQuery(this.userId, this.roles);
	console.log(JSON.stringify(q));
	return {$and:[originalQuery, q]};
};