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
            console.log("Crawling Product "+res.options.product_id);
            if($('.m-detail-404').length){ console.log("404 Found");
                if($('.m-detail-404').text().trim() == "This Product is no longer available."){
                    con.query("UPDATE `crawled_products2` SET `has_crawled` = '1', has_attribute = '0' WHERE `product_id` = ?", res.options.product_id, (error, results, fields) => {
                        if (error) {
                            throw error;
                        }
                    });
                    done();                    
                }
            }
            if($('.do-overview').length){

 
                var attrsLength = $('dl.do-entry-item dt.do-entry-item').length;


                if(attrsLength > 0){
                $('dl.do-entry-item ').each(function(j, dEntryItem){
                    
                    var attrName = $(dEntryItem).find('dt.do-entry-item').text().trim();
                    var attrVal = $(dEntryItem).find('dd.do-entry-item-val').text().trim();

                    if(attrName == ''){return;}

                    attrName  = attrName.replace(':','');
                    attrVal  = attrVal.replace(':','');
                    
                    con.query('SELECT * FROM category_attributes2 WHERE category_id = ? AND attribute_name = ? AND attribute_value = ?', [res.options.parent_category_id,attrName,attrVal], (error, attrResults, fields) => {

                        if (error) {
                            done();
                            throw error;
                        }else{
                         
                            if(attrResults.length > 0){
                                log.Info("Attribute Name with Attribute Value already exist: SELECT * FROM category_attributes2 WHERE category_id = "+res.options.parent_category_id+" AND attribute_name = "+attrName+" AND attribute_value = "+attrVal);
                                return;
                            }

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
                                    done();
                                }
                            });
                        }
                    });  
                    
                    if(attrsLength == j+1){
                       
                        con.query("UPDATE `crawled_products2` SET `has_crawled` = '1'  WHERE `product_id` = ?", res.options.product_id, (error, results, fields) => {
                            if (error) {
                                //console.log("Error");
                                throw error;
                            }else{
                                //console.log("done");
                                done();
                            }
                        });
                    }

                });
                }else{
                    console.log("Found no Attributes");
                    con.query("UPDATE `crawled_products2` SET `has_crawled` = '1', has_attribute = '0' WHERE `product_id` = ?", res.options.product_id, (error, results, fields) => {
                        if (error) {
                            throw error;
                        }
                    });
                    done();
                }
            }else{
                // no attributes found
                console.log("Not found");
                log.Info("No Attribue found for Product "+res.options.product_id);
                con.query("UPDATE `crawled_products2` SET `has_crawled` = '1', has_attribute = '0' WHERE `product_id` = ?", res.options.product_id, (error, results, fields) => {
                    if (error) {
                        throw error;
                    }
                });
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
        var query = 'SELECT * FROM crawled_products2 WHERE has_crawled = 0 order by product_id desc limit 1000';

        con.query(query, [category_id], (error, products, fields) => {
            if (error) {
                throw err;
            }else{

                if(products.length < 1){console.log("No Products to Crawl");return false;}
                products.forEach(function(result,index){
                    
                   
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

                               console.log({
                                    uri: productUrl,
                                    parent_category_id: result.category_id,
                                    product_id: productId
                                }); 

                                c.queue({
                                    uri: productUrl,
                                    parent_category_id:  result.category_id,
                                    product_id: productId
                                }) 
                            }

                       
                        }
                    });
                   
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