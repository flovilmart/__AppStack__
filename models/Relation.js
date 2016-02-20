const Relation = module.exports = {};

Relation.name = function(fromClass, toClass) {
	return "_"+fromClass+"-"+toClass;
};