MT(
	MT.ui.DomElement = function(type){
		type = type || "div";
		this.el = document.createElement(type);
		this.style = this.el.style;
		this.el.ctrl = this;
		
		this.index = 0;
		this.isVisible = false;
		
		// this is confusing, but handy... 
		// probably should rename to something else
		// used only by treeView
		this.children = [];
	},
	{
		_parent: null,
		appendChild: function(el, index){
			el.parent = this;
			el.show(this.el);
			return el;
		},
		
		hasParent: function(parent){
			var p = this.parent;
			while(p){
				if(p == parent){
					return true;
				}
				p = p.parent;
			}
		},
		
		remove: function(){
			if(this.el.parentNode){
				this.el.parentNode.removeChild(this.el);
			}
		},

		show: function(parent){
			
			if(parent == void(0)){
				if(this.parent){
					this._parent = this.parent.el;
				}
				if(!this._parent){
					this._parent = document.body;
				}
			}
			else{
				this._parent = parent;
			}
			
			this._parent.appendChild(this.el);
			this.isVisible = true;
		},
   
		hide: function(){
			if(!this.el.parentNode){
				return;
			}
			this.el.parentNode.removeChild(this.el);
			this.isVisible = false;
		},
		
		addClass: function(cls){
			var cl = cls.split(".");
			if(cl.length > 1){
				for(var i=0; i<cl.length; i++){
					this.addClass(cl[i]);
				}
				return;
			}
			cl = cls.split(" ");
			if(cl.length > 1){
				for(var i=0; i<cl.length; i++){
					this.addClass(cl[i]);
				}
				return;
			}
			
			if(!this.hasClass(cls)){
				this.el.className = (this.el.className + " " + cls).trim();
			}
		},
		
		removeClass: function(cls){
			var cl = cls.split(".");
			if(cl.length > 1){
				for(var i=0; i<cl.length; i++){
					this.removeClass(cl[i]);
				}
				return;
			}
			cl = cls.split(" ");
			if(cl.length > 1){
				for(var i=0; i<cl.length; i++){
					this.removeClass(cl[i]);
				}
				return;
			}
			
			var c = this.el.className.split(" ");
			for(var i=0; i<c.length; i++){
				if(cls == c[i]){
					c[i] = c[c.length-1];
					c.length = c.length - 1;
				}
			}
			this.el.className = c.join(" ");
		},
		
		hasClass: function(cls){
			var c = this.el.className.split(" ");
			for(var i=0; i<c.length; i++){
				if(cls == c[i]){
					return true;
				}
			}
			return false;
		},
		
		_x: 0,
		set x(val){
			this.setX(val);
		},
		
		setX: function(val){
			this._x = val;
			this.style.left = val+"px";
			this.width = this._width;
			
			//this.style.transform =  "translate(" + this.y + "px," + this.y + "px)";
		},
   
		get x(){
			return this._x;
		},
   
		_y: 0,
		set y(val){
			this.setY(val);
		},
		
		setY: function(val){
			this._y = val;
			this.style.top = val;
			//this.style.transform =  "translate(" + this.x + "px," + this.y + "px)";
		},
   
		get y(){
			return this._y;
		},
   
		_height: 0,
		get height(){
			if(this._height){
				return this._height;
			}
			return this.el.offsetHeight;
		},
		set height(val){
			this.setHeight(val);
		},
		
		setHeight: function(val){
			
			this._height = val;
			if(val == 0){
				this.style.height = "auto";
			}
			else{
				this.style.height = val+"px";
			}
		},
   
		_width: 0,
		get width(){
			if(this._width){
				return this._width;
			}
			return this.el.offsetWidth;
		},
		set width(val){
			this.setWidth(val);
		},
   
		setWidth: function(val){
			if(!val){
				return;
			}
			
			this._width = val;
			this.style.width = val+"px";
		},
   
		resize: function(w, h){
			this.width = w || this._width;
			this.height = h || this._height;
		},
		
		calcOffsetY: function(upTo){
			upTo = upTo || document.body;
			var ret = this.el.offsetTop;
			p = this.el.offsetParent;
			while(p && p != upTo){
				ret += p.offsetTop - p.scrollTop;
				p = p.offsetParent;
			}
			
			return ret;
		},
		calcOffsetX: function(upTo){
			upTo = upTo || document.body;
			var ret = this.el.offsetLeft;
			p = this.el.offsetParent;
			while(p && p != upTo){
				ret += p.offsetLeft - p.scrollLeft;
				p = p.offsetParent;
				
			}
			return ret;
		},
		ox: 0,
		oy: 0,
   
		setAbsolute: function(){
			this.style.position = "absolute";
			this.style.top = 0;
			this.style.left = 0;
		},
   
		fitIn: function(){
			this.style.position = "absolute";
			this.style.top = 0;
			this.style.right = 0;
			this.style.bottom = 0;
			this.style.left = 0;
			this.style.height = "auto";
		},
   
		inheritSize: function(el){
			this.x = el.x;
			this.y = el.y;
			this.width = el.width;
			this.height = el.height;
		},
   
		getStyle: function(){
			return window.getComputedStyle(this.el);
		},
   
		sort: function(a,b){
			return a.index - b.index;
		},
   
		addChild: function(child, index){
			child.index = index;
			this.children.push(child);
			this.children.sort(this.sort);
			
			if(index !== void(0)){
				var ch = null;
				for(var i=0; i<this.children.length; i++){
					ch = this.children[i];
					ch.index = i;
					if(ch.el.parentNode){
						ch.el.parentNode.removeChild(ch.el);
					}
					if(ch.isVisible){
						this.el.appendChild(ch.el);
					}
				}
			}
			else{
				if(child.isVisible){
					this.el.appendChild(child.el);
				}
			}
			child.parent = this;
			return child;
		},
		
		removeChild: function(child){
			if(child.el.parentNode == this.el){
				this.el.removeChild(child.el);
			}
			
			for(var i=0; i<this.children.length; i++){
				if(this.children[i] == child){
					this.children.splice(i, 1);
					return;
				}
			}
		},
   
		_index: 0,
		get index(){
			return this._index;
		},
		
		set index(idx){
			this._index = idx;
		},
		
		clear: function(){
			this.el.innerHTML = "";
		},
   
		get bounds(){
			return this.el.getBoundingClientRect();
		}
		
	}
);