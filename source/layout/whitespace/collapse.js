module.exports = function(str, options) {
	options = options || {};

	var format = options.format || 'normal';
	var strip = options.strip;

	str = str.replace(/\r\n?/g, '\n');

	if(format === 'normal' || format === 'nowrap' || format === 'pre-line') {
		str = str.replace(/[\t ]*\n[\t ]*/g, '\n');
	}
	// if(format === 'pre' || format === 'pre-wrap') {
	// 	str = str.replace(/ /g, '\xa0');
	// }
	// if(format === 'pre-wrap') {
	// 	str = str.replace(/\xa0([^\xa0])/g, '\xa0\u200b$1');
	// }
	if(format === 'normal' || format === 'nowrap') {
		str = str.replace(/\n/g, ' ');
	}
	if(format === 'normal' || format === 'nowrap' || format === 'pre-line') {
		str = str.replace(/\t/g, ' ');
		str = str.replace(/ +/g, ' ');

		if(strip) str = str.replace(/^ /, '');
	}
	// if(format === 'nowrap') {
	// 	str = str.replace(/ /g, '\xa0');
	// }

	return str;
};
