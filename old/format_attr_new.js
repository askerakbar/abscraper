/* Get the Product Attributes under a Product Category of Alibaba.com  */

const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const mysql = require('mysql')
const log = require('node-file-logger');
const options = require('./config.js');

logOtptions = options.logOtptions;
dbOptions = options.dbOptions;
   
log.SetUserOptions(logOtptions); 

const con = mysql.createConnection(dbOptions);

var productUrl = 'https://xwww.alibaba.com/product-detail/Sweet-Instant-Soybean-Milk-Powder_60703102040.html?spm=a2700.galleryofferlist.normalList.1.1a76134bivGieh&s=p';

request(productUrl, function (error, response, productHtml) {

    try {
        var $p = cheerio.load(productHtml);
    } catch (error) {
        console.log(productUrl);
    }
    
    $p('div.m-gallery-product-item-wrap .title a:nth-child(1)').each(function(productCount, element){
        console.log(productCount);
    });
    
    
});

    

