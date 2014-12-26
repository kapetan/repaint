exports.hard = function(str, format) {
	var hard = format === 'pre' || format === 'pre-wrap' || format === 'pre-line';
	return hard ? str.split('\n') : [str];
};

exports.soft = function(str, format) {
	var soft = format === 'normal' || format === 'pre-wrap' || format === 'pre-line';
	return soft ? str.split(/( +|-+)/) : [str];
};
