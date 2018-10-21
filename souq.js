const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

var sourceUrl = 'https://uae.souq.com/ae-en/shop-all-categories/c/?ref=nav';

request(sourceUrl, function (error, response, html) {

  if (error && response.statusCode != 200) {
    return;
  }

  var $ = cheerio.load(html);
  var categories = [];
  var categoryId = 1;

  //$('').each(function(i, sidenavelement){

    $('.row.shop-all-container .side-nav li').each(function(j, lielement){
      var level1Li = $(lielement);

      if(!$(level1Li).hasClass('parent')){
      
        var data = {
          id:categoryId,
          name: level1Li.text(),
          url:level1Li.find('a').attr('href'),
          parent:0
        };


      }

      categories.push(data);

      categoryId++;

    });

    fs.writeFile('content.json', JSON.stringify(categories, null, 4), (err) => {
      if (err) {
        console.log(err)
      }
    })

  });

  


