var express = require('express');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');
var urladdress = require('url');
var fs = require('fs');
var http = require('http');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

var DOWNLOAD_DIR = './downloads/';

/* GET home page. */
router.post('/scrapUrl', function (req, res) {
  var dataUrl = req.body.scrap;
  console.log(dataUrl);
  if (dataUrl != undefined && dataUrl != null && dataUrl !='') {
    var url = dataUrl;
    var q = urladdress.parse(url, true);
    var folderName = q.pathname.replace(/^\/|\/$/g, '');
    folderName = folderName.replace('properties/', '');
    var mkdir = 'mkdir -p ' + DOWNLOAD_DIR + folderName;
    folderpath = DOWNLOAD_DIR + folderName + '/';
    request(url, function (error, response, html) {
      if (!error) {
        var $ = cheerio.load(html);
        //main image on the page
        var mainImage = $('.the_content.fixinner-youtube img').attr('src');
        // image collections show in gallery code
        var src = [];
        $('img').each(function () {
          var href = $(this).attr('src');
          if (href.length > 0) {
            exec(mkdir, function (err, stdout, stderr) {
              if (err) throw err;
              else download_file_httpget(href, folderpath);
            });

          } else {
            exit(0);
          }

          src.push(href);
        });
        src.map((image) => {
          if (image.includes('150')) {
            image = image.replace('-150x150', '');
            download_file_httpget(image, folderpath);
          } else {
            console.log("naah")
          }
        });
        var data = {
          'src': src,
          'mainImage': mainImage
        };

        /**
         * data saved into json object
         *
         *
         * fs.writeFile('./' + folderName + '.json',JSON.stringify(data,null,4), function (err, file) {
           if (!err) {
             console.log("ok file");
           } else {
             throw err;
           }
         })

         * */


        //res.send({ 'src': src, 'mainImage': mainImage });
        res.render('success', { success: 'Done scrapping' });
      }
    })
  } else {
    res.redirect('/404');
  }
});

router.get('/404', function (req, res) {
  res.render('404', { message: 'Please enter proper url' });
})



router.get('/', function (req, res) {
  res.render('index', { title: 'scraping form' });
});

// Function to download file using HTTP.get
download_file_httpget = function (file_url, folderpath) {
  var options = {
    host: urladdress.parse(file_url).host,
    port: 80,
    path: urladdress.parse(file_url).pathname
  };

  var file_name = urladdress.parse(file_url).pathname.split('/').pop();
  var file = fs.createWriteStream(folderpath + file_name);
  http.get(options, function (res) {
    res.on('data', function (data) {
      file.write(data);
    }).on('end', function () {
      file.end();
    });
  });
};

module.exports = router;
