'use strict';

class Query {
	constructor(userId, roles, useMasterKey) {
		this.userId = userId;
		this.roles = roles;
		this.useMasterKey = useMasterKey;
	}

	readQuery(originalQuery) {
		return this.query(originalQuery, "read");
	}

	writeQuery(originalQuery) {
		return this.query(originalQuery, "write");
	}

	query(originalQuery, rorw) {
		if (this.useMasterKey) {
			return originalQuery;
		}
		var q = Query.createQuery(this.userId, this.roles, rorw);
		return {$and:[originalQuery, q]};
	}

	static createSimpleRuleQuery(identifier, rw) {
		var q = {};
		q[`ACL.${identifier}.${rw}`] = true;
		return q;
	}

	static createQuery(userId, roles, rw) {
		var queries = [];
		queries.push({"ACL": {$exists: false}});
		queries.push(Query.createSimpleRuleQuery("*", rw));
		if (userId) {
			queries.push(Query.createSimpleRuleQuery(userId, rw));
		}
		queries.concat(roles.map(function(role){
			return Query.createSimpleRuleQuery(`role:${role}`, rw);
		}));
		return {$or:queries};
	}

	createReadQuery() {
		return Query.createQuery(this.userId, this.roles, "read");
	}

	createWriteQuery() {
		return Query.createQuery(this.userId, this.roles, "write");
	}
}

module.exports = Query;