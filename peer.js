/*
GNU GENERAL PUBLIC LICENSE

This is an example of a client-side for a multi-party chat over WebRTC.

Copyright (C) 2014 Cristóbal Medina López.
http://www.p2psp.org

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var signalingChannel = new WebSocket("ws://127.0.0.1:9876/");
var configuration = {iceServers: [{ url: 'stun:stun.l.google.com:19302' }]};
//var configuration = {iceServers: [{ url: 'stun:150.214.150.137:3478' }]};
var pcs=[];
var channel=[];
var peerlist=[];
var idpeer=0;
var iniConnection = document.getElementById("initiateConnection");
var msg = document.getElementById("msg");
var btnSend= document.getElementById("send");
var tini;
btnSend.disabled=true;

iniConnection.onclick=function(e){
    document.getElementById("receive").innerHTML="<b>Conecting...</b>";
    tini = performance.now();
	for (i in peerlist){
		start(true,peerlist[i]);
	}
    iniConnection.disabled=true;
};

btnSend.onclick=sendChatMessage;


function callPHP(params) {
    var httpc = new XMLHttpRequest(); // simplified for clarity
    var url = "http://www.hpca.ual.es/~cmedina/files/save.php";
    httpc.open("POST", url, true); // sending as POST

    httpc.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    httpc.setRequestHeader("Content-Length", params.length); // POST request MUST have a Content-Length header (as per HTTP/1.1)

    httpc.onreadystatechange = function() { //Call a function when the state changes.
    if(httpc.readyState == 4 && httpc.status == 200) { // complete and no errors
        alert(httpc.responseText); // some processing here, or whatever you want to do with the response
        }
    }
    httpc.send(params);
}


// call start(true,i) to initiate
function start(isInitiator,i) {
    //iniConnection.disabled=true;
    //console.log("creado para: "+i);
    pcs[i] = new webkitRTCPeerConnection(configuration);
    
    
    // send any ice candidates to the other peer
    pcs[i].onicecandidate = function (evt) {
	//signalingChannel.send(JSON.stringify({ "candidate": evt.candidate , "idtransmitter":'"'+idpeer+'"', "idreceiver":'"'+i+'"'}));
    };


    // let the "negotiationneeded" event trigger offer generation
    pcs[i].onnegotiationneeded = function () {
	pcs[i].createOffer().then(function(desc){
	    return pcs[i].setLocalDescription(desc);
	})
	    .then(function() {
		//console.log("Local description:" + pcs[i].localDescription.sdp);
		signalingChannel.send(JSON.stringify({ "sdp": pcs[i].localDescription , "idtransmitter":'"'+idpeer+'"', "idreceiver":'"'+i+'"'}));
		})
		.catch(logError);
	};

	if (isInitiator) {
		// create data channel and setup chat
		channel[i] = pcs[i].createDataChannel("chat"+i);
		setupChat(i);
	} else {
	// setup chat on incoming data channel
		pcs[i].ondatachannel = function (evt) {
			channel[i] = evt.channel;
			setupChat(i);
		};
	}  
	//console.log("Saved in slot: "+i+" PeerConection: "+pcs[i]);
}

/*
function localDescCreated(desc,pc,i) {
    console.log("Setting local description...")
    return pc.setLocalDescription(desc, function () {
	console.log("localDescription is Set");
    });
}
*/

signalingChannel.onmessage = function (evt) {
	handleMessage(evt);
}

function handleMessage(evt){
    var message = JSON.parse(evt.data);
	
    if (message.numpeer){    
	idpeer=message.numpeer;
	console.log('Peer ID: '+idpeer);
	return;  	
    }  

    if (message.peerlist){    
	console.log('Peer List '+message.peerlist);
	peerlist=JSON.parse(message.peerlist);
	/*
	for (i in peerlist){
	    console.log("Peer: "+peerlist[i]);
	}
	*/
	return;  	
    }  
   
    var id=(message.idtransmitter).split('"').join(''); 
    var idreceiver=(message.idreceiver).split('"').join(''); 
    //console.log("Received from: "+id+" and send to: "+idreceiver);

    if (!pcs[id]) { 
	console.log('%cCreate a new PeerConection','background: #222; color: #bada55');
	peerlist.push(id);
	console.log("PEER LIST UPDATE: "+peerlist);
	start(false,id);
    } 	

    if (message.sdp && idreceiver==idpeer){
        //console.log("Mensaje SDP recibido: " + message.sdp + " tipo " + message.sdp.type);

	if (message.sdp.type == "offer"){
	    console.log("Create and send ANSWER");
	    pcs[id].setRemoteDescription(message.sdp).then(function () {
	    console.log("remoteDescription is Set");
    	    // if we received an offer, we need to answer
        	return pcs[id].createAnswer();
	    })
		.then(function(answer) {
		    return pcs[id].setLocalDescription(answer);
		})
		.then(function () {
		    signalingChannel.send(JSON.stringify({ "sdp": pcs[id].localDescription , "idtransmitter":'"'+idpeer+'"', "idreceiver":'"'+id+'"'}));
		}).catch(logError);
	}else{
	    pcs[id].setRemoteDescription(message.sdp).catch(logError);
	    var tend = performance.now();
	    console.log("%cAnswer for peer "+ id + " received after " + (tend - tini) + " milliseconds. ",'background: #CCC; color: #FF0000');
	    var json = "Answer for peer "+ id + " received after " + (tend - tini) + " milliseconds.";
	    callPHP('fn=filename.txt&data='+json);
        };
    }
    
    if (message.candidate && idreceiver==idpeer){
	console.log("Received ice candidate: "+ message.candidate.candidate); 
	pcs[id].addIceCandidate(message.candidate).catch(logError);
    }

}

function setupChat(i) {
    channel[i].onopen = function () {
        btnSend.disabled=false;
	document.getElementById("chatcontrols").style.display="inline";
    };

    channel[i].onmessage = function (evt) {
       document.getElementById("receive").innerHTML+="<br />"+evt.data;
    };
}

function sendChatMessage() {
    document.getElementById("receive").innerHTML+="<br />"+document.getElementById("login").value+ ": "+msg.value;
	for (i in peerlist){  
		if (peerlist[i]!=idpeer){
			console.log("send to "+peerlist[i]);  
			try{
				channel[peerlist[i]].send(document.getElementById("login").value+ ": "+msg.value);
			}catch(e){
				console.log(i+" said bye!");
			}

		}
	}
}

function logError(error) {
    console.log(error.name + ": " + error.message);
}
