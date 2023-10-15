"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),Object.defineProperty(exports,"default",{enumerable:!0,get:function(){return p}});var e=require("@tkow/syncenv");function t(e,t){(null==t||t>e.length)&&(t=e.length);for(var r=0,n=Array(t);r<t;r++)n[r]=e[r];return n}function r(e){if(void 0===e)throw ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function n(e,t,r,n,o,u,c){try{var i=e[u](c),a=i.value}catch(e){r(e);return}i.done?t(a):Promise.resolve(a).then(n,o)}function o(e,t){if(!(e instanceof t))throw TypeError("Cannot call a class as a function")}function u(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}function c(e,t,r){return t&&u(e.prototype,t),r&&u(e,r),e}function i(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e){return(a=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function l(e,t){return(l=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function f(e,r){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){var r,n,o=null==e?null:"undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=o){var u=[],c=!0,i=!1;try{for(o=o.call(e);!(c=(r=o.next()).done)&&(u.push(r.value),!t||u.length!==t);c=!0);}catch(e){i=!0,n=e}finally{try{c||null==o.return||o.return()}finally{if(i)throw n}}return u}}(e,r)||function(e,r){if(e){if("string"==typeof e)return t(e,r);var n=Object.prototype.toString.call(e).slice(8,-1);if("Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n)return Array.from(n);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return t(e,r)}}(e,r)||function(){throw TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}var s=function(){"use strict";function e(){o(this,e),i(this,"current",0)}return c(e,[{key:"genRandomStr",value:function(){return this.current++,"gcpcall"+this.current}},{key:"accessSecretVersion",value:function(e,t,r){return Promise.resolve([{payload:{data:this.genRandomStr()}},{name:"dummy"},{}])}}]),e}(),p=function(e){"use strict";!function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&l(e,t)}(p,e);var t,u=(t=function(){if("undefined"==typeof Reflect||!Reflect.construct||Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch(e){return!1}}(),function(){var e,n,o=a(p);if(t){var u=a(this).constructor;n=Reflect.construct(o,arguments,u)}else n=o.apply(this,arguments);return(e=n)&&("object"==(e&&"undefined"!=typeof Symbol&&e.constructor===Symbol?"symbol":typeof e)||"function"==typeof e)?e:r(this)});function p(){var e,t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:new s;return o(this,p),i(r(e=u.call(this)),"client",void 0),e.client=t,e}return c(p,[{key:"fetchValues",value:function(e,t){var r,o=this;return(r=function(){var t,r,n,u,c,i,a,l,s,p,y,b,h;return function(e,t){var r,n,o,u,c={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return u={next:i(0),throw:i(1),return:i(2)},"function"==typeof Symbol&&(u[Symbol.iterator]=function(){return this}),u;function i(u){return function(i){return function(u){if(r)throw TypeError("Generator is already executing.");for(;c;)try{if(r=1,n&&(o=2&u[0]?n.return:u[0]?n.throw||((o=n.return)&&o.call(n),0):n.next)&&!(o=o.call(n,u[1])).done)return o;switch(n=0,o&&(u=[2&u[0],o.value]),u[0]){case 0:case 1:o=u;break;case 4:return c.label++,{value:u[1],done:!1};case 5:c.label++,n=u[1],u=[0];continue;case 7:u=c.ops.pop(),c.trys.pop();continue;default:if(!(o=(o=c.trys).length>0&&o[o.length-1])&&(6===u[0]||2===u[0])){c=0;continue}if(3===u[0]&&(!o||u[1]>o[0]&&u[1]<o[3])){c.label=u[1];break}if(6===u[0]&&c.label<o[1]){c.label=o[1],o=u;break}if(o&&c.label<o[2]){c.label=o[2],c.ops.push(u);break}o[2]&&c.ops.pop(),c.trys.pop();continue}u=t.call(e,c)}catch(e){u=[6,e],n=0}finally{r=o=0}if(5&u[0])throw u[1];return{value:u[0]?u[1]:void 0,done:!0}}([u,i])}}}(this,function(v){switch(v.label){case 0:t={},r=!0,n=!1,u=void 0,v.label=1;case 1:v.trys.push([1,6,7,8]),c=Object.entries(e)[Symbol.iterator](),v.label=2;case 2:if(r=(i=c.next()).done)return[3,5];return l=(a=f(i.value,2))[0],s=a[1],[4,o.client.accessSecretVersion({name:s})];case 3:(b=null===(y=f.apply(void 0,[v.sent(),1])[0].payload)||void 0===y?void 0:null===(p=y.data)||void 0===p?void 0:p.toString())||console.warn("Cannot access gcp secret ".concat(s)),t[l]=b||"",v.label=4;case 4:return r=!0,[3,2];case 5:return[3,8];case 6:return h=v.sent(),n=!0,u=h,[3,8];case 7:try{r||null==c.return||c.return()}finally{if(n)throw u}return[7];case 8:return[2,t]}})},function(){var e=this,t=arguments;return new Promise(function(o,u){var c=r.apply(e,t);function i(e){n(c,o,u,i,a,"next",e)}function a(e){n(c,o,u,i,a,"throw",e)}i(void 0)})})()}}]),p}(e.PluginInterface);i(p,"pluginId","gcp");
