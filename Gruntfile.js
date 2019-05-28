module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    sass: {                              // Task
      dist: {                            // Target
        options: {                       // Target options
          style: 'expanded'
        },
        files: {                         // Dictionary of files
          'css/css1.css': 'scss/css1.scss',       // 'destination': 'source'
          'css/css2.css': 'scss/css2.scss'
        }
      }
    },  
    concat: {
      css: {
        src: [
          'css/css1.css',
          'css/css2.css',
        ],
        // dest: 'css/all.css'
        dest: 'css/<%= pkg.name %>.css'
      },
      js: {
        src: [
          'js/js1.js',
          'js/js2.js',
        ],
        // dest: 'js/all.js'
        dest: 'js/<%= pkg.name %>.js'
      },
    },
    cssmin: {
      css: {
        src: 'css/<%= pkg.name %>.css',
        dest: 'css/<%= pkg.name %>.min.css'
      },
    },
    uglify: {
      js: {
        src: 'js/<%= pkg.name %>.js',
        dest: 'js/<%= pkg.name %>.min.js',
      }
    },
    watch: {
      css: {
        files: ['scss/*.scss'],
        tasks: ['sass:dist', 'concat:css', 'cssmin:css']
      },
      js: {
        files: ['js/*.js'],
        tasks: ['concat:js', 'uglify:js']
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('dev', ['sass','concat', 'cssmin', 'uglify', 'watch']);
};
