(function(){
	var fs = require("fs");
	var path = require("path");
	var errors = {
		ENOENT: 34
	};
	var that = MT.core.FS = {
		path: path,
		fs: fs,
		queue: [],
 
		writeFile: function(file, contents, cb){
			this.addQueue([this._writeFile, file, contents, this.mkcb(cb) ]);//no arguments
		},
 
		_writeFile: function(file, contents, cb){
			fs.writeFile(file, contents, function(e){
				if(e){
					console.log("FS::writeFile Error",e);
				}
				cb(e);
			});
			
		},
		
		readFile: function(file, cb){
			this.addQueue([this._readFile, file, this.mkcb(cb)]);//no arguments
		},
 
		_readFile: function(file, cb){
			fs.readFile(file, function(e, contents){
				if(e){
					console.log("FS::Readfile", e);
				}
				
				cb(e, contents);
				that.processQueue();
			});
		},
		
		mkdir: function(path, cb){
			this.addQueue([this._mkdir, path, this.mkcb(cb)]);//no arguments
		},
		_mkdir: function(path, cb){
			fs.stat(path, function(err){
				if(err && err.errno !== errors.ENOENT){
					console.log("FS::mkdir err", err);
				}
				
				fs.mkdir(path, cb);
			});
			
		},
		
		move: function(a, b, cb){
			this.addQueue([this._move, a, b, this.mkcb(cb)]);//no arguments
		},
 
		_move: function(a, b, cb){
			fs.rename(a, b, cb);
		},
		
		copy: function(a, b, cb){
			this.addQueue([this._copyWrap, a, b, this.mkcb(cb)]);//no arguments
		},
 
		_copyWrap: function(source, target, cb){
			var that = this;
			fs.stat(source, function(err, stats){
				if(err){
					console.log("FS::copy", source + "->" + target);
					console.log(err);
					console.trace();
					cb();
					return;
				}
				
				
				if(stats.isDirectory()){
					that._mkdir(target, function(){
						
						that._readdir(source, true, [], function(buff){
						
							//process.exit();
							
							var toCopy = buff.length;
							var cbx = function(){
								toCopy--;
								if(toCopy == 0){
									cb();
								}
							};
							
							for(var i=0; i<buff.length; i++){
								that._copyWrap(buff[i].fullPath, target + path.sep + buff[i].name, cbx);
							}
							
							if(toCopy == 0){
								cb();
							}
							
						});
						
					});
					
				}
				else{
					that._copy(source, target, cb);
				}
				
			});
			
		},
		
		
		
		_copy: function(source, target, cb) {
			
			var rd = fs.createReadStream(source);
			rd.on("error", function(err) {
				done(err);
			});
			
			var wr = fs.createWriteStream(target);
			wr.on("error", function(err) {
				done(err);
			});
			
			wr.on("close", function(ex) {
				done();
			});
			
			rd.pipe(wr);

			function done(err) {
				if(err){
					console.log("FS::copy error ---> ", err, source + " -> " + target);
					console.trace();
					return;
				}
				if(typeof cb == "function"){
					cb();
				}
			}
			
		},
		
 
		rm: function(file, cb){
			this.addQueue([this._rm, file, this.mkcb(cb)]);//no arguments
		},
		_rm: function(file, cb){
			fs.lstat(file, function(err, stats){
				if(err){
					console.log("FS::rm error", err);
					cb();
					return;
				}
				if(stats.isDirectory()){
					this._rmdir(file, cb);
					return;
				}
				fs.unlink(file, cb);
				
			});
			
		},
 
		rmdir: function(dir, cb){
			this.addQueue([this._rmdir, dir, this.mkcb(cb)]);
		},
		_rmdir: function(dir, cb){
			var that = this;
			this._readdir(dir, true, [], function(buffer){
				var d = null;
				
				if(buffer.length == 0){
					fs.rmdir(dir, cb);
					return;
				}
				
				
				for(var i=0; i<buffer.length; i++){
					d = buffer[i];
					//direcotry
					if( d.contents != void(0) ){
						if(d.contents.length){
							that._rmdir(dir + path.sep + d.name, function(){
								that._rmdir(dir, cb);
							});
						}
						else{
							fs.rmdir(dir + path.sep + d.name, function(){
								that._rmdir(dir, cb);
							});
						}
						break;
					}
					//file
					fs.unlink(dir + path.sep + d.name, function(){
						that._rmdir(dir, cb);
					});
					break;
				}
				
			});
		},
 
		readdir: function(dir, recurse, cb){
			this.addQueue([this._readdir, dir, recurse, [], this.mkcb(cb)]);//no arguments
			
		},
		
		_readdir: function(dir, recurse, buffer, cb){
			fs.readdir(dir, function(err, files){
				if(err){
					console.log("FS:EROR",err);
					cb(buffer);
					return;
				}
				that._readdir_stat(dir, files, 0, cb, buffer, recurse);
			});
			
		},
		
 
		_readdir_stat: function(dir, list, index, cb, buffer, recurse){
			if(!list || index >= list.length){
				cb(buffer);
				return;
			}
			var file = list[index];
			var toRead = 0;
			fs.lstat(dir + path.sep + file, function(err, stats){
				
				var p = dir + path.sep + file;//path.normalize( path.relative( "../client", dir + path.sep + file));
				
				if(stats.isDirectory()){
					buffer.push({
						name: file,
						fullPath: p,
						contents: []
					});
					if(recurse){
						that._readdir(dir + path.sep + file, recurse, buffer[buffer.length-1].contents, function(){
							that._readdir_stat(dir, list, index + 1, cb, buffer, recurse);
						});
					}
					else{
						that._readdir_stat(dir, list, index + 1, cb, buffer, recurse);
					}
				}
				else{
					buffer.push({
						name: file,
						fullPath: p
					});
					that._readdir_stat(dir, list, index + 1, cb, buffer, recurse);
				}
			});
		},
		processing: false,
		activeTaks: null,
 
		processQueue: function(){
			if(this.processing){
				return;
			}
			
			var next = this.queue.shift();
			if(next){
				this.activeTaks = next;
				
				this.processing = true;
				next.shift().apply(this, next);
			}
			else{
				this.processing = false;
			}
		},
		
		addQueue: function(q){
			this.queue.push(q);
			this.processQueue();
		},
 
		mkcb: function(cb){
			var that = this;
			var cbx = function(a, b, c){
				if(typeof cb === "function"){
					cb(a, b, c);
				}
				that.processing = false;
				that.processQueue();
			};
			
			return cbx;
		}
	};
	
	
})();