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



var c = new Crawler({
    maxConnections: 10,
    rateLimit: 2000,
    callback: function (error, res, done) {
        
        if (error) {
            console.log(error);
        } else {
            var $ = res.$;

            if($('div.m-gallery-product-item-wrap .title a:nth-child(1)').length < 1){
               log.Info("No Items found for category Id"+res.options.category_id);
               done();
               return;
            }else{
               
            

            $('div.m-gallery-product-item-wrap .title a:nth-child(1)').each(function(productCount, element){

                var productUrl = $(element).attr('href');
                var productTitle = $(element).attr('title').trim();
                var metaContent = $(element).attr('data-domdot');
                var uidString = metaContent.split(',');
                var pid = '';

                uidString.forEach(function(element, index) {
                    var metaValues = element.split(':');
                    if(metaValues[0] == 'pid'){
                        pid = metaValues[1];
                    }
                });

                var uid = pid;

                if(productCount >= 9){
                   errorMsg = "Finished Crawling Products under Category:"+res.options.category_id+" Last Product is "+pid;
                   log.Error(errorMsg);
                   done();
                   return false; 
                } 

                con.query('SELECT * FROM crawled_products2 WHERE uid = ? AND category_id = ?', [uid,res.options.category_id], (error, products, fields) => {
                    if (error) {
                        throw error;
                    }else{
                        
                        if(products.length > 0){ done();return false;}

                        var productData = {
                            product_name : productTitle,
                            url: url.resolve(siteUrl, productUrl),
                            category_id:res.options.category_id,
                            meta_content: JSON.stringify({title:metaContent}),
                            meta_description:'',
                            uid:pid,
                        }

                        con.query('INSERT INTO crawled_products2 SET ?', productData, (error, results, fields) => {
                            if (error) {
                                throw error;
                            }else{
                                done();
                                log.Info(productData);
                            }
                        });
                    
                        
                    }
                })


            });

            }

        }

    }
});

c.on('schedule',function(options){
   // options.proxy = "";
});

con.connect(err => {
    
    if (err) {
        throw err;
    } else {

        
        con.query('select * from categories2 where category_id >= 4050', [], (error, products, fields) => {
            
            if (error) {
                log.Error("Error");
            }else{
                
                products.forEach(function (result, index) {
                    category_id = result.category_id;
                    var pageUrl = result.url;

                    if (pageUrl == ''  || pageUrl == null) {
                        log.Error("Error2");
                        return;
                    }else{
                        c.queue({
                            uri:  encodeURI(pageUrl),
                            category_id: category_id
                        })
                    }
                    
                });


            }
        });
     
    }
});



process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
});


