"use strict";const e=require("../utils/request.js");exports.getFeed=(s,t)=>e.get("/api/recommends/feed",{scene:s,size:t});
