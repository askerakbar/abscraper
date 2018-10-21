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

con.connect(err => {
    if (err) {
        throw err;
    }else{

        var category_id = 1114;

        con.query('SELECT * FROM crawled_products WHERE category_id = ? AND has_crawled = 0', [category_id], (error, products, fields) => {
            if (error) {
                throw err;
            }else{

                if(products.length < 1){return false;}

                products.forEach(function(result,index){

                    var productId = result.product_id;
                    var productUrl = result.url;
                    con.query('SELECT * FROM category_attributes WHERE product_id = ?', [productId], (error, catAttrRow, fields) => {
                    if (error) {
                        throw error;
                    }else{
                        
                        if(catAttrRow.length > 0){console.log("Product has been already crawled");return;}

                        request(productUrl, function (error, response, productHtml) {
                            var $p = cheerio.load(productHtml);
                            if($p('.do-overview').length){
                                $p('dl.do-entry-item ').each(function(j, dEntryItem){

                                    var attrName = $p(dEntryItem).find('dt.do-entry-item').text().trim();
                                    var attrVal = $p(dEntryItem).find('dd.do-entry-item-val').text().trim();

                                    if(attrName == ''){return;}

                                    attrName  = attrName.replace(':','');
                                    attrVal  = attrVal.replace(':','');
                                    
                                    con.query('SELECT * FROM category_attributes WHERE category_id = ? AND attribute_name = ? AND attribute_value = ?', [category_id,attrName,attrVal], (error, attrResults, fields) => {
                                        
                                        if (error) {
                                            throw error;
                                        }else{
                                            
                                            if(attrResults.length > 0){console.log("Cat alread exist");return;}
                                        
                                            attrResults.forEach(function(attrResultRow,index){
                                                if(attrResultRow.attribute_value == attrVal){
                                                    return;
                                                }
                                                // split and remove existing values from the attribute values's column
                                                attrVal = attrResultRow.attribute_value+","+attrVal;
                                            });

                                            var attrData = {
                                                category_id:category_id,
                                                attribute_name: attrName,
                                                attribute_value: attrVal,
                                                product_id:productId
                                            };

                                            con.query('INSERT INTO category_attributes SET ?', attrData, (error, results, fields) => {
                                                if (error) {
                                                    throw error;
                                                }
                                            });


                                        }


                                    });   

                
                                });
                                
                                con.query("UPDATE `crawled_products` SET `has_crawled` = '1'  WHERE `product_id` = ?", result.product_id, (error, results, fields) => {
                                    if (error) {
                                        throw error;
                                    }
                                });


                            }
                        });
                        }
                    });

                });


            }
        })


    }
})

function insertAttr(data){
/* console.log(data.attribute_name);
console.log(data.category_id);
return; */
    // check if category Id exist with the same attribute name
    con.query('SELECT * FROM category_attributes where attribute_name = ? AND category_id = ?', [data.attribute_name,data.category_id], (error, results, fields) => {
        if (error) {
            throw error;
        }
        if(results.length > 0){
            console.log(results.length);
            console.log("exist");
        //console.log(results[0].attribute_value);process.exit();
            // if exist then append the current value into it else insert new one
            var newAttrValue = results[0].attribute_value+" "+data.attribute_value;
            con.query("UPDATE `category_attributes` SET `attribute_value` = ?  WHERE `category_attribue_id` = ?",[newAttrValue,results[0].category_attribue_id], (error, results, fields) => {
                if (error) {
                    throw error;
                }
            });
        }else{
           // return;
           // console.log("yes not exist");
            con.query('INSERT INTO category_attributes SET ?', data, (error, results, fields) => {
                if (error) {
                    throw error;
                }
            });
        }
    });

    //process.exit();
}