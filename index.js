var path        = require('path'),
    fs          = require('fs'),
    _           = require('underscore'),
    phantom     = require('phantom'),
    easyimg     = require('easyimage'),
    async       = require('async'),
    freeport    = require('freeport'),
    mkdirp      = require('mkdirp');

/**
 * Generate a preview for a given URL
 * @param {String} url The URL of the webpage
 * @param {String} name A name for the preview used to construct the path of the generated files
 * @param {String} parentPath The path of a folder where preview files are to be stored
 * @param {Object} viewportSize An dimensions object for the size of the viewport. Omit for sensible defaults
 * @param {Object} outputSizes A object where the keys are size names and the values are dimensions. Omit for sensible defaults
 * @param {Function} callback Callback with signature function(error, success) {...}
 */
exports.generatePreview = function(url, name, parentPath, viewportSize, outputSizes, callback) {
  if (typeof url !== "string") {
    callback(new Error("generatePreview: Parameter 'url' must be a string"));
  }

  if (typeof name !== "string") {
    callback(new Error("generatePreview: Parameter 'name' must be a string"));
  }

  if (typeof parentPath !== "string") {
    callback(new Error("generatePreview: Parameter 'parentPath' must be a string"));
  }

  if (outputSizes === null || typeof outputSizes !== "object") {
    outputSizes = {
      small:  { width: 160, height: 120 },
      medium: { width: 320, height: 240 },
      large:  { width: 640, height: 480 }
    };
  }

  if (viewportSize === null || typeof viewportSize !== "object") {
    viewportSize = { width: 1024, height: 768 };
  }

  viewportSize.y = 0; // Start at the top of the page

  var sizePaths = {}; // This will be returned once complete

  var jobPath = path.join(parentPath, name);  // The folder for this particular job

  var outputFile = getImageFilePath('full');  // This is where the original will be saved

  // Returns the full path to where an image of a particular size should be saved
  function getImageFilePath(sizeName) {
    var imageFilePath = path.join(jobPath, sizeName + '.png');
    sizePaths[sizeName] = imageFilePath;  // Keep a record of where we store everything
    return imageFilePath;
  }

  createPath(); // Begin the method chain

  // Make sure the path is created
  function createPath() {
    mkdirp(jobPath, function(err) {
      if (!err) {
        findPort();
      }
      else {
        console.error('generatePreview: createPath: Error creating path', err);
        callback(err, null);
      }
    });
  }

  // Find a free port
  function findPort() {
    freeport(function(err, phantomPort) {
      renderPage(phantomPort);
    });
  }

  // Use PhantomJS to generate a preview
  function renderPage(phantomPort) {
    console.log('generatePreview: renderPage: PhantomJS port = ', phantomPort);

    phantom.create({ port: phantomPort }, function(ph) {
      ph.createPage(function(page) {
        page.set('viewportSize', viewportSize);

        page.open(url, function(status) {
          console.log("generatePreview: renderPage: Opened page = ", url, status);

          page.render(outputFile, function() {
            ph.exit();

            resizeAll();
          });
        });
      });
    });
  }

  // Generate our thumbnails
  function resizeAll() {
    var calls = [];

    _.each(_.pairs(outputSizes), function(pair) {
      var sizeName = pair[0], size = pair[1];

      calls.push(_.partial(resize, sizeName, size.width, size.height));
    });

    async.parallel(calls, function(err, results) {
      console.log('generatePreview: resizeAll: Parallel complete', results, err);

      callback(null, sizePaths);  // MAIN EXIT POINT: All resized, lets get out of here
    });
  }

  // These run in parallel to resize each of our thumbnails
  function resize(sizeName, width, height, callback) {
    var thumbFile = getImageFilePath(sizeName);

    console.log('generatePreview: resize: Thumbnail generating... ', thumbFile);

    easyimg.crop({ src: outputFile, dst: thumbFile, cropwidth: viewportSize.width, cropheight: viewportSize.height, x: 0, y: 0, gravity: 'North' }, function() {
      console.log('generatePreview: resize: Thumbnail generated =', thumbFile);

      easyimg.resize({ src: thumbFile, dst: thumbFile, width: width, height: height }, function() {
        save(sizeName, thumbFile, callback);
      });
    });
  }

  // Save each thumbnail to disk
  function save(sizeName, thumbFile, callback) {
    fs.readFile(thumbFile, function(err, data) {
      if (data && data.length) {
        console.log('generatePreview: save: Length = ' + data.length + ' bytes', thumbFile);
        sizePaths[sizeName] = thumbFile;  // Store the file path for this particular size
        callback(null, null);
      }
      else {
        console.log('generatePreview: save: Error saving thumbnail', err);
        callback(err, null);
      }
    });
  }
};
