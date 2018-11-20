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
const con = mysql.createConnection(dbOptions)

con.connect(err => {
    if (err) {
        throw err;
    }else{
        const pageUrl = 'https://www.alibaba.com//Products';

        request(pageUrl, function (error, response, categoryHtml) {

            var $c = cheerio.load(categoryHtml);

            $c('.cg-main').find('.item.util-clearfix').each(function(i, element){
                var mainTitle = $c(element).find('.big-title').text().replace(/^\s+|\s+$/gm, '');
                console.log(mainTitle);
                con.query('INSERT INTO categories SET ?', {
                        parent_category_id: 0,
                        name: mainTitle,
                        description: "",
                    }, (error, results, fields) => {
                    if (error) {
                        throw error;
                    }else{
                        
                        $c(element).find('.sub-item-wrapper .sub-item').each(function(j, subElement){

                            var mainCatId = results.insertId;
                            var subTitle = $c(subElement).find('h4.sub-title a').text().replace(/^\s+|\s+$/gm, '');
                            var subUrl = $c(subElement).find('h4.sub-title a').attr('href');

                            con.query('INSERT INTO categories SET ?', {
                                parent_category_id: mainCatId,
                                name: subTitle,
                                description: "",
                                url: url.resolve(siteUrl, subUrl),
                            }, (error, results, fields) => {

                                if (error) {
                                    throw error;
                                }


                               $c(subElement).find('.sub-item-cont li').each(function(j, childElement){
                                   var childTitle = $c(childElement).find('a').text().trim();
                                   var childUrl = $c(childElement).find('a').attr('href');

                                    con.query('INSERT INTO categories SET ?', {
                                        parent_category_id: results.insertId,
                                        name: childTitle,
                                        description: "",
                                        url: url.resolve(siteUrl, childUrl),
                                    }, (error, results, fields) => {

                                        if (error) {
                                            throw error;
                                        }

                                    });

                               });
                               

                            });
                          

                        });

                        

                        
                    }
                });
            });

        });
    }
});
