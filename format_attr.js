const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const mysql = require('mysql');
const log = require('node-file-logger');
const url = require('url');
const options = require('./config.js');
const util = require("util");

logOtptions = options.logOtptions;
dbOptions = options.dbOptions;


class Database {
    constructor( config ) {
        this.connection = mysql.createConnection(config);
    }
    query( sql, args ) {
        return new Promise( ( resolve, reject ) => {
            this.connection.query( sql, args, ( err, rows ) => {
                if ( err ){
                    return reject( err );
                }else{
                    resolve( rows );
                }
            } );
        } );
    }
    close() {
        return new Promise((resolve,reject ) => {
            this.connection.end( err => {
                if (err){
                    return reject( err );
                }else{
                    resolve();
                }
            } );
        } );
    }
}

let someRows, otherRows;

database = new Database(dbOptions);
var myArray = [];



database.query('SELECT attribute_name,category_id, COUNT(*) FROM category_attributes GROUP BY attribute_name,category_id HAVING COUNT(*) > 1')
.then(rows =>{

    rows.forEach(element => {
        var currentAttrName = element.attribute_name;
        
        database.query('SELECT * FROM category_attributes where attribute_name = ? AND category_id',[element.attribute_name])
        .then(function(results){
            var concatAttrValue = '';
            results.forEach(resultVal => {
                concatAttrValue = concatAttrValue+','+resultVal.attribute_value.trim();
            });     
            
            concatAttrValue = concatAttrValue.split(',');
         
            arr = concatAttrValue.filter (function (value, index, array) { 
                return array.indexOf (value) == index;
            });
            arr = concatAttrValue.filter (function (value, index, array) { 
                return value != '';
            });
            //console.log(currentAttrName);
            arr = concatAttrValue.filter (function (value, index, array) { 
                return array.indexOf (value) == index;
            });
            
         
        

            formatArray([{
                attribute_name:currentAttrName,
                attribute_value:JSON.stringify(arr)
            }]);
           // console.log(myArray);
            
            
          

        })
      
     

    })
    
    
    

})
.then( () => {
  //  return database.close();
} );

var formatArray = function(val){
    var val = val[0];
    var attrName = val.attribute_name;
    var attrVal = val.attribute_value;
    
    database.query('SELECT * FROM category_attributes where attribute_name = ? AND category_id order by category_attribue_id asc limit 1',[attrName])
    .then(function(data) {
        if(data.length){
            database.query('DELETE FROM category_attributes where category_attribue_id: = ? order by category_attribue_id asc limit 1',[attrName]).then(function(delData){

            });
        }
    });
    // delete everything except the first row

    
}