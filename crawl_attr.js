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
            //console.log(error);
        } else {
            var $ = res.$;
            
            if($('.do-overview').length){
                //console.log("12223");
                $('dl.do-entry-item ').each(function(j, dEntryItem){
                   /// console.log("22222");
                    var attrName = $(dEntryItem).find('dt.do-entry-item').text().trim();
                    var attrVal = $(dEntryItem).find('dd.do-entry-item-val').text().trim();

                    if(attrName == ''){return;}

                    attrName  = attrName.replace(':','');
                    attrVal  = attrVal.replace(':','');
                    
                    con.query('SELECT * FROM category_attributes2 WHERE category_id = ? AND attribute_name = ? AND attribute_value = ?', [res.options.parent_category_id,attrName,attrVal], (error, attrResults, fields) => {
                        //console.log(attrResults.length);
                        if (error) {
                            done();throw error;
                        }else{
                           // console.log(res.options.category_id);return false;
                            if(attrResults.length > 0){done();log.Info("No Attribue found for Product"+res.options.product_id);return;}

                            attrResults.forEach(function(attrResultRow,index){
                                if(attrResultRow.attribute_value == attrVal){
                                    return;
                                }
                                attrVal = attrResultRow.attribute_value+","+attrVal;
                            });

                            var attrData = {
                                category_id:res.options.parent_category_id,
                                attribute_name: attrName,
                                attribute_value: attrVal,
                                product_id:res.options.product_id
                            };
                            
                            con.query('INSERT INTO category_attributes2 SET ?', attrData, (error, results, fields) => {
                                if (error) {
                                    done();throw error;
                                }else{
                                    
                                    log.Info(attrData);
                                    con.query("UPDATE `crawled_products2` SET `has_crawled` = '1'  WHERE `product_id` = ?", res.options.product_id, (error, results, fields) => {
                                        if (error) {
                                            throw error;
                                        }
                                    });
                                    done();
                                }
                            });
                        }
                    });   
                });
            }else{
                done();
            }


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
        var category_id = 0;    
        var query = 'SELECT * FROM crawled_products2 WHERE has_crawled = 0 order by product_id asc limit 1000 offset 6000';
        con.query(query, [category_id], (error, products, fields) => {
            if (error) {
                throw err;
            }else{

                if(products.length < 1){console.log("No Products to Crawl");return false;}
                products.forEach(function(result,index){
                    
                   // category_id = result.category_id;
                    var productId = result.product_id;
                    var productUrl = result.url;
                    productUrl = url.resolve(siteUrl, productUrl);
                    con.query('SELECT * FROM category_attributes2 WHERE product_id = ?', [productId], (error, catAttrRow, fields) => {
                        if (error) {
                            console.log("error");
                            throw error;
                        }else{

                            if(catAttrRow.length > 0){
                               console.log("Product has been already crawled ID:"+productId);
                                con.query("UPDATE `crawled_products2` SET `has_crawled` = '1'  WHERE `product_id` = ?", productId, (error, results, fields) => {
                                    if (error) {
                                        throw error;
                                    }
                                }); 
                                return;
                            }else{
                             /* console.log({
                                    uri: productUrl,
                                    parent_category_id: result.category_id,
                                    product_id: productId
                                }); */
                                    c.queue({
                                    uri: productUrl,
                                    parent_category_id:  result.category_id,
                                    product_id: productId
                                }) 
                            }

                       
                        }
                    });
                   // return false;
                });
            }
        });

    }
});

c.on('schedule',function(options){
   // options.proxy = 'http://84.52.88.125:32666';
  //  options.proxy = "http://93.78.206.59:54199";
    //options.proxy = "http://185.129.2.227:32938";
    //options.proxy = "http://200.119.243.219:58241";
   // options.proxy = 'http://110.74.199.205:55699';

   // options.proxy = 'socks4://168.228.184.116:4145';
   options.proxy = "http://212.72.159.22:30323";
    
}); 


process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
});