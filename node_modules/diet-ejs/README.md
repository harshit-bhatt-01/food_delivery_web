# diet-ejs
dietjs support for ejs template engine

For more informations about dietjs framework: [diet.js](http://dietjs.com/)

For more informations about the ejs template engine : [http://ejs.co/](http://ejs.co/)

## instalation
```
npm install --save diet-ejs
```

## example

**index.js**

```js

var app=require('diet')();
var ejs=require('diet-ejs')();


app.header(ejs);

app.get('/',function($){
        $.data.message='John';
        $.render('index');   
});

app.listen('http://localhost:7500');


```

**index.ejs**
```
<p> Hello <%=message%> </p>
```

## customisation

By default the middleware comes with some default settings that you can customize using the options in the module constructor.
```
var ejs=require('diet-ejs')({
        template_dir: './views',   //by default the location of the templates is in the views folder 
        template_ext: 'ejs',       //the default extension of the template files is .ejs
        debug:false,               //no debug info
        cache:false                //no caching
});

```




