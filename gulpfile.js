var gulp = require('gulp');
var aws = require('aws-sdk');
var runSequence = require('run-sequence');
var concat = require('gulp-concat');
var del = require('del');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var path = require('path');
var rename = require('gulp-rename');
var sequence = require('run-sequence');
var uglify = require('gulp-uglify');
var wrap = require('gulp-wrap');
var zip    = require('gulp-zip');
var lambda = require('gulp-awslambda');
var cloudformation = require('gulp-cloudformation');

var paths = {};

paths.src = {};
paths.src.root = './src';
paths.src.js    = path.join(paths.src.root, 'js/*.js');

paths.build = {};
paths.build.root  = './build';
paths.build.js    = path.join(paths.build.root, 'js');

paths.dist = {};
paths.dist.root = './dist';
paths.dist.js   = path.join(paths.dist.root, 'js');

var isDev = (gutil.env.env == 'dev')
gulp.task('env', function() {
    if (isDev) {
       gutil.log(gutil.colors.cyan('Development Env'));
    } else if (gutil.env.env == 'test'){
       gutil.log(gutil.colors.magenta('Test Env'));
    } else if (gutil.env.env == 'prod'){
       gutil.log(gutil.colors.magenta('Production Env'));
    } else {
      gutil.log(gutil.colors.red('--env=X, X must be dev|test|prod'));
      process.exit(1)
    }
    if ((!isDev) && (!gutil.env.role)) {
      gutil.log(gutil.colors.red('--role=, must be a valid aws arn'));
      process.exit(1)
    }
});

gulp.task('lint:js', function() {
        return gulp.src(paths.src.js)
                .pipe(jshint())
                .pipe(jshint.reporter('unix'));

});
gulp.task('lint', ['lint:js']);

gulp.task('compile:clean', function(callback) {
    if (isDev) {
       del([paths.build.root], callback);
    } else {
       del([paths.dist.root], callback);
    }
});

gulp.task('compile:js', function() {
    return gulp.src([ paths.src.js, ])
                           .pipe(isDev ? gutil.noop() : concat('index.js'))
                           .pipe(isDev ? gutil.noop() : uglify())
                           .pipe(gulp.dest(isDev ? paths.build.js : paths.dist.js))
});

gulp.task('compile', function(callback) {
         sequence('compile:clean', ['compile:js'], callback);
});

var lambda_params = {
        FunctionName: 'BrightCoveNotificationAPI',
        Role: gutil.env.role
};

var aws_opts = {
        region: 'eu-west-1'
};

gulp.task('deploy:dynamotable', function(callback) {
    var cloudformation_template = 'cloudformation/' + gutil.env.env + '-dynamo-brightcovetable.json';
    aws.config.credentials = new aws.SharedIniFileCredentials({ profile: gutil.env.env });
    return gulp.src([cloudformation_template])
        .pipe(cloudformation.init({   //Only validates the stack files
                region: aws_opts.region,
                accessKeyId: aws.config.credentials.accessKeyId,
                secretAccessKey: aws.config.credentials.secretAccessKey
            })
            .pipe(cloudformation.deploy({
                // Capabilities: [ 'CAPABILITY_IAM' ] //needed if deploying IAM Roles
            }))
            .on('error', function(error) {
                gutil.log('Unable to deploy dynamo table exiting With Error', error);
                throw error;
            }));
});

gulp.task('deploy:apigw', function(callback) {
    var cloudformation_template = 'cloudformation/' + gutil.env.env + '-api-gw-brightcove.json';
    aws.config.credentials = new aws.SharedIniFileCredentials({ profile: gutil.env.env });
    // gutil.log('Access key: ' + aws.config.credentials.accessKeyId);
    // gutil.log('Secret key: ' + aws.config.credentials.secretAccessKey);
    return gulp.src([cloudformation_template])
        .pipe(cloudformation.init({   //Only validates the stack files
                region: aws_opts.region,
                accessKeyId: aws.config.credentials.accessKeyId,
                secretAccessKey: aws.config.credentials.secretAccessKey
            })
            .pipe(cloudformation.deploy({
                // Capabilities: [ 'CAPABILITY_IAM' ] //needed if deploying IAM Roles
            }))
            .on('error', function(error) {
                gutil.log('Unable to deploy api-gw exiting With Error', error);
                throw error;
            }));
});

gulp.task('deploy:lambda', function(callback) {
    return  gulp.src('index.js')
            .pipe(zip('archive.zip'))
            .pipe(lambda(lambda_params, aws_opts, gutil.env.env))
            .pipe(gulp.dest('.'));
});

gulp.task('deploy', function(callback) {
    sequence('deploy:lambda', 'deploy:apigw', callback);
});

gulp.task('default', function(callback) {
    if  (gutil.env.env == 'dev') {
       sequence('env', 'lint', 'compile', callback);
    } else {
       sequence('env', 'lint', 'compile', 'deploy', callback);
    }

});
