module.exports = Relation = {};

Relation.name = function(fromClass, toClass) {
	return "_"+fromClass+"-"+toClass;
};