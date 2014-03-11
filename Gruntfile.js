var jsFiles = [
	'Gruntfile.js',
	'pgspy.js',
	'lib/**/*.js',
	'test/**/*.js'
];

module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-jsbeautifier');

	grunt.initConfig({
		jshint: {
			files: jsFiles
		},
		jsbeautifier: {
			files: jsFiles,
			options: {
				js: {
					indentWithTabs: true
				}
			}
		}
	});

	grunt.registerTask('default', ['jshint', 'jsbeautifier']);
};
