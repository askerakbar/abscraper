var Crawler = require("crawler");
var url = require('url');
var fs = require('fs');
const request = require('request');


var Crawler = require("crawler");
 
var c = new Crawler({
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            var $ = res.$;
            console.log($("title").text());
        }
        done();
    }
});

c.queue('http://www.amazon.com');


c.on('schedule',function(options){
    freeProxy = 'https://gimmeproxy.com/api/getProxy';
    options.proxy = async function(){
         request(freeProxy, function (error, response, html) {
            resp = JSON.parse(response.body);
            return resp.curl;
        });     
    }
}); 

