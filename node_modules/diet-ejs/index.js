var ejs=require('ejs');
var fs=require('fs');


module.exports=function(options){

	var options=options||{};
	
	var defaults={
		template_dir:'./views',
		template_ext:'ejs',
		cache:'false',
		debug:'false'
		
	};

	for(var prop in defaults){
		if(defaults.hasOwnProperty(prop) && options[prop]===undefined){
			options[prop]=defaults[prop];
		}
	}
	
	return function($){

		$.render=function(filename){

			if(arguments.length===0)$.error('No template file specified!');
			$.header('Content-Type','text/html;charset=UTF-8');
			var fname=filename+'.'+options.template_ext;
			var tpath=(options.template_dir.slice(-1)==='/')?(options.template_dir+fname):(options.template_dir+'/'+fname);
			var tsrc=fs.readFileSync(tpath,'utf8');
		
			var ret=ejs.compile(tsrc,{
				filename: fname,
				cache: options.cache,
				debug: options.debug,
			})($.data);
			
			$.end(ret);


			
		}

		$.return();
	}
}

