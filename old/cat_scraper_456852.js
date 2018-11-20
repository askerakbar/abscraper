
let m = new Nightmare({
    width: 1600,
    height: 900,
    show: false,
    waitTimeout: 20000
});



function crawlLink(url,prevLinkText,prevParentId){
    return m
    .goto(url)
    .wait('.related-category-label')
    .evaluate(function() {
        return document.body.innerHTML;
    })
    .end()
    .then((html) => {
        console.log("test 1")
        var $c = cheerio.load(html);
        if($c('.m-gallery-product-filter-breadcrumb.checked a').length < 1){
            console.log(36);
            return;
        }

        if($c('.m-gallery-product-filter-breadcrumb.checked a').text() != prevLinkText){
            console.log(41);
            log.error(urlText + "text Not Found");
            return;
        }else{
            if($c('.m-gallery-product-filter-breadcrumb.checked a').text()){

                con.query('INSERT INTO categories_2 SET ?', {
                    parent_category_id: catId,
                    name: urlText,
                    description: "",
                    url: urllib.resolve(siteUrl, $c('.m-gallery-product-filter-breadcrumb.checked a').attr('href')),
                }, (error, results, fields) => {

                    if (error) {
                        throw error;
                    }
                    console.log(55);
                    if($c('.m-gallery-product-filter-breadcrumb.checked').next().attr('class') == 'm-gallery-product-filter-breadcrumb category-item'){
                        console.log(57);
                        $c('.m-gallery-product-filter-breadcrumb.category-item .category-item-popover').find('a').each(function(i, element){
                            let crawlUrl = urllib.resolve(siteUrl, $c(element).attr('href'));
                            console.log(60);
                            return crawlLink(crawlUrl,$c(element).text(),results.insertId);
                        });  

                    }

                });
                
            }
        }

        
    });
}

var url = 'https://www.alibaba.com/catalog/alcoholic-beverage_cid204?spm=a2700.9161164.1.26.279d4e02M25NSD'
var urlText = 'Alcoholic Beverage';
var catId = 1076;

m
.goto(url)
.wait(1000)
.wait('.related-category-label')
.evaluate(function() {
    return document.body.innerHTML;
})
.then((html) => {
    return crawlLink(url,urlText,catId);
/*     var $c = cheerio.load(html);
    if($c('.m-gallery-product-filter-breadcrumb.checked a').length < 1){
        log.error("Link" + urlText+" Not Found");
        return;
    }

    if($c('.m-gallery-product-filter-breadcrumb.checked').next().attr('class') == 'm-gallery-product-filter-breadcrumb category-item'){
        
        $c('.m-gallery-product-filter-breadcrumb.category-item').find('a').each(function(i, element){
            let crawlUrl = urllib.resolve(siteUrl, $c(element).attr('href'));
            crawlLink(crawlUrl,$c(element).text(),catId);
           console.log(urllib+" - "+$c(element).text()+" - "+catId)
        });     
        
    }else{
        if($c('.m-gallery-product-filter-breadcrumb.checked a').text() == urlText){
           
        }
        return;
    } */
    

})
.then(() => {
  //  return m.end(() => { console.log('End') })
})

