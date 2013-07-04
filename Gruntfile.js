module.exports = function(grunt) {
  grunt.initConfig({
    clean: {
      src: ['public/dist']
    },
    less: {
      compile: {
        options: {
          yuicompress: true
        },
        files: {
          'public/dist/css/style.css': 'public/less/bootstrap.less'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-less');

  grunt.registerTask('default', ['clean', 'less']);
};