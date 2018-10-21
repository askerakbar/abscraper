/* Get the product data from a product category of alibaba.com */

const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const mysql = require('mysql');
const log = require('node-file-logger');
const url = require('url');
const siteUrl = 'https://www.alibaba.com/';
const options = require('./config.js');

logOtptions = options.logOtptions;
dbOptions = options.dbOptions;

log.SetUserOptions(logOtptions); 
const con = mysql.createConnection(dbOptions);

con.connect(err => {

    if (err) {
        throw err;
    }else{
        
        category_id = 1114;

        //con.query('SELECT * FROM crawled_products WHERE AND category_id = ? AND has_crawled = 0', [category_id], (error, products, fields) => {
        con.query('SELECT * FROM categories WHERE category_id = ?', [category_id], (error, products, fields) => {
        if (error) {
            throw error;
        }else{
         
            var pageUrl = products[0].url;

            request(pageUrl, function (error, response, categoryHtml) {
            
                var $c = cheerio.load(categoryHtml);
            
                $c('div.m-gallery-product-item-wrap .title a:nth-child(1)').each(function(productCount, element){

                    var productUrl = $c(element).attr('href');
                    var productTitle = $c(element).attr('title').trim();
                    var metaContent = $c(element).attr('data-domdot');
                    var uidString = metaContent.split(',');
                    var pid = '';

                    uidString.forEach(function(element, index) {
                        var metaValues = element.split(':');
                        if(metaValues[0] == 'pid'){
                            pid = metaValues[1];
                        }
                    });

                    var uid = pid;
                    console.log(pid);
            
                    if(productCount >= 9){
                       errorMsg = "Finished Crawling Products under Category:"+category_id+" Last Product is "+pid;
                       log.Error(errorMsg);
                       return false; 
                    } 


                    con.query('SELECT * FROM crawled_products WHERE uid = ? AND category_id = ?', [uid,category_id], (error, products, fields) => {
                        if (error) {
                            throw error;
                        }else{
                            
                        if(products.length > 0){return false;}

                            var productData = {
                                product_name : productTitle,
                                url: url.resolve(siteUrl, productUrl),
                                category_id:category_id,
                                meta_content: JSON.stringify({title:metaContent}),
                                meta_description:'',
                                uid:pid,
                            }
                            console.log(productData);
                    
                            con.query('INSERT INTO crawled_products SET ?', productData, (error, results, fields) => {
                                if (error) {
                                    throw error;
                                }
                            });

                        }
                    })
            
                });
           
            });

        }

    });
    }
});

process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
});