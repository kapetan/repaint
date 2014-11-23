module.exports = function(first, second) {
	for(var i = 0; i < first.length; i++) {
		var a = first[i];
		var b = second[i];

		if(a === b) continue;
		return a - b;
	}

	return 0;
};
