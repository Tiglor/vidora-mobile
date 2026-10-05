"use strict";const e=require("../common/vendor.js");exports.useDebounce=function(u,n=300){const o=e.ref(null);return function(...e){o.value&&clearTimeout(o.value),o.value=setTimeout(()=>u(...e),n)}};
