export default (v: null | number, digits = 0) => {
	if (v == null) return '?';
	const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
	if (v === 0) return '0';

	const i = Math.floor(Math.log(Math.abs(v)) / Math.log(1024));
	return (v < 0 ? '-' : '') + (Math.abs(v) / Math.pow(1024, i)).toFixed(digits).replace(/\.0+$/, '') + sizes[i];
};
