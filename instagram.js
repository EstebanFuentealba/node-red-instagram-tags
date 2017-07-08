module.exports = function(RED) {
    "use strict";

    var Url = require('url');
    var request = require('request');
    
    var IMAGE = "image";// currently we're only considering images
    
    var repeat = 60000; // 1 minutes => the repeat frequency of the input node
    
    function handleInputNodeInput(node, msg, config) {
        node.status({fill:"green", shape:"dot", text:("#"+config.tag||" ")});
        console.log("handleInputNodeInput",handleInputNodeInput);
        request.get(`https://www.instagram.com/explore/tags/${config.tag}/?__a=1`,{
           json: true 
        }, function(err, result, data) {
            let nodes = data.tag.top_posts.nodes;
            if(nodes.length>0) {
                node.latestTagID = nodes[0].id;
                nodes.map(n => {
                    node.send({
                        id: n.id,
                        topic: n.owner.id,
                        payload: n.caption,
                        instagram: n,
                        date: n.date
                    });
                })
                
            }
            
        })
    }
    function LowerCaseNode(config) {
        console.log("config",config)
        RED.nodes.createNode(this,config);
        var node = this;
        node.latestTagID = null;
        node.interval = null; // used to track individual refresh intervals

        
        node.on("input", function(msg) {
            msg = {};
            handleInputNodeInput(node, msg, config);
        });
        
        node.interval = setInterval(function() { // self trigger
            node.emit("input", {});
        }, repeat);
        node.emit("input", {});
        
        node.on("close", function() {
            if (node.interval !== null) {
                clearInterval(node.interval);
            }
            node.latestTagID = null;
        });
    }
    RED.nodes.registerType("instagram-tag", LowerCaseNode);
    
};