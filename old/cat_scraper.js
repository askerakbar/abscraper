const Nightmare = require('nightmare');
const urllib = require('url');
const request = require('request');

const cheerio = require('cheerio');
const mysql = require('mysql');
const options = require('./config.js');
const siteUrl = 'https://www.alibaba.com/';
dbOptions = options.dbOptions;
const con = mysql.createConnection(dbOptions)
const log = require('node-file-logger')


var url = 'https://www.alibaba.com/catalog/alcoholic-beverage_cid204?spm=a2700.9161164.1.26.279d4e02M25NSD'
var urlText = 'Alcoholic Beverage';
var catId = 1076;

crawlLink(url,urlText,catId);


function crawlLink(url,prevLinkText,prevParentId){
    console.log(url,prevLinkText,prevParentId);
    request(url, function (error, response, html) {

        var $c = cheerio.load(html);
        if($c('.m-gallery-product-filter-breadcrumb.checked a').length < 1){
            console.log(36);
            return;
        }

        if($c('.m-gallery-product-filter-breadcrumb.checked a').text()){
            if($c('.m-gallery-product-filter-breadcrumb.checked').next().attr('class') == 'm-gallery-product-filter-breadcrumb category-item'){
                
                if(prevParentId != 1076){
                    con.query('INSERT INTO categories_2 SET ?', {
                        parent_category_id: prevParentId,
                        name: prevLinkText,
                        description: "",
                        url: urllib.resolve(siteUrl, $c('.m-gallery-product-filter-breadcrumb.checked a').attr('href')),
                    }, (error, results, fields) => {         

                        $c('.m-gallery-product-filter-breadcrumb.category-item .category-item-popover').find('a').each(function(i, element){
                            let crawlUrl = urllib.resolve(siteUrl, $c(element).attr('href'));
                            return crawlLink(crawlUrl,$c(element).text(),results.insertId);
                        });  


                    });
                }else{
                    return;
                }



            }
        }

    });


}





