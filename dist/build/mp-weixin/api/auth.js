"use strict";const e=require("../utils/request.js"),s=require("../config/client.js");exports.login=(i,t)=>e.post("/api/auth/login",{phone:i,password:t,clientId:s.CLIENT_ID});
