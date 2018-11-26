var Crawler = require("crawler");
var url = require('url');
var fs = require('fs');
const siteUrl = 'https://www.alibaba.com/';
const log = require('node-file-logger');
const mysql = require('mysql');
const options = require('./config.js');
logOtptions = options.logOtptions;
dbOptions = options.dbOptions;
log.SetUserOptions(logOtptions);
const con = mysql.createConnection(dbOptions);
var Crawler = require("crawler");

//https://www.npmjs.com/package/crawler



var c = new Crawler({
    maxConnections: 10,
    rateLimit: 2000,
    callback: function (error, res, done) {
        if (error) {
            console.log(error);
        } else {

            var $ = res.$;

            var cat_name = $('.m-gallery-product-filter-breadcrumb.checked a').text().trim();

   
            con.query('select count(*) as count from categories2 where category_id = ?', [res.options.parent_category_id], (error, results, fields) => {

                if (error) {
                    log.Error(error);
                } else {

                    if (results.length > 0) {
                        if ($('.m-gallery-product-filter-breadcrumb.checked').next().attr('class') == 'm-gallery-product-filter-breadcrumb category-item') {

                            $('.m-gallery-product-filter-breadcrumb.category-item .category-item-popover').find('a').each(function (i, element) {

                                let crawlUrl = url.resolve(siteUrl, $(element).attr('href'));
                                var eleName = $(element).text().trim();
                                crawlUrl = encodeURI(crawlUrl);
                                urlWithOutQueryString = getPathFromUrl(crawlUrl);
                                var urlVals = urlWithOutQueryString.split("/");
                                lastUri = urlVals[urlVals.length - 1];

                                con.query('select name,url from categories2 where url = ?', [urlWithOutQueryString], (error, resultsQ, fields) => {
                                    if (resultsQ.length < 1) {
                                        console.log(res.options.uri + " already exist");
                                        con.query('INSERT INTO categories2 SET ?', {
                                            parent_category_id: res.options.parent_category_id,
                                            name: eleName,
                                            description: "",
                                            meta_content: $('.m-gallery-filter-wrap').find('.filter-result-item').eq(1).html(),
                                            url: url.resolve(siteUrl, $(element).attr('href')),
                                        }, (error, results2, fields) => {
                                            if (error) {
                                                console.log(error);
                                            }
                                            console.log("Inserted Item " + results2.insertId);
                                            c.queue({ uri: crawlUrl, parent_category_id: results2.insertId });
                                            done();
                                        });
                                    } else {
                                        done();
                                    }
                                });

                            });

                        } else {
                            console.log("76Done: " + res.options.uri + "|Result:" + results.length);
                            done();
                        }
                    } else {
                        console.log("80Done: " + res.options.uri + "|Result:" + results.length);
                        done();
                    }
                }
            });
        }

    }
});


function getPathFromUrl(url) {
    return url.split(/[?#]/)[0];
}




con.connect(err => {

    if (err) {
        throw err;
    } else {
        
        con.query('SELECT * FROM `categories2` where parent_category_id = 1050', [], (error, products, fields) => {
            if (error) {
                log.Error("Error3");
            } else {

                products.forEach(function (result, index) {
                    console.log(result.category_id);
                    category_id = result.category_id;
                    var pageUrl = result.url;

                    if (pageUrl == '') {
                        log.Error("Error2");
                        return;
                    }

                    c.queue({
                        uri: pageUrl,
                        parent_category_id: category_id
                    })


                });

            }
        });
    }
});

c.on('schedule',function(options){
    options.proxy = "";
});


process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
});