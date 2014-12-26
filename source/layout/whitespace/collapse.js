module.exports = function(str, options) {
	options = options || {};

	var format = options.format || 'normal';
	var strip = options.strip;

	str = str.replace(/\r\n?/g, '\n');

	if(format === 'normal' || format === 'nowrap' || format === 'pre-line') {
		str = str.replace(/[\t ]*\n[\t ]*/g, '\n');
	}
	if(format === 'normal' || format === 'nowrap') {
		str = str.replace(/\n/g, ' ');
	}
	if(format === 'normal' || format === 'nowrap' || format === 'pre-line') {
		str = str.replace(/\t/g, ' ');
		str = str.replace(/ +/g, ' ');

		if(strip) str = str.replace(/^ /, '');
	}

	return str;
};
