module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    sass: {                              // Task
      dist: {                            // Target
        options: {                       // Target options
          style: 'expanded'
        },
        files: {                         // Dictionary of files
          'public/css/main.css': 'public/scss/main.scss',       // 'destination': 'source'
          // 'css/css2.css': 'scss/css2.scss'
        }
      }
    },  
    concat: {
      css: {
        src: [
          'public/css/bootstrap.min.css',
          'public/css/main.css',
        ],
        dest: 'public/css/bosspiuvn-main.css'
        // dest: 'css/<%= pkg.name %>.css'
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
        src: 'public/css/bosspiuvn-main.css',
        dest: 'public/css/bosspiuvn-main.min.css'
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
        files: ['public/scss/*.scss', 'public/scss/responsive/*.scss'],
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
