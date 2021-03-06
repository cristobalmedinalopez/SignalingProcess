#!/usr/bin/python -O
# -*- coding: iso-8859-15 -*-

'''
GNU GENERAL PUBLIC LICENSE

This is an example of a signaling server for a multi-party chat over WebRTC.

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
'''
import socket, threading, time, base64, hashlib, struct, binascii, sys
import json
from SimpleWebSocketServer import WebSocket, SimpleWebSocketServer

class Signaling(WebSocket):

        def handleMessage(self):
		datos=str(self.data)
		try:
		    decoded = json.loads(datos)
		except (ValueError, KeyError, TypeError):
		    print "JSON format error"

		if 'sdp' in decoded:		
			if decoded['sdp']['type'] == 'offer':
				print 'Offer form peer ' + decoded['idtransmitter'][1:-1] + ' to peer ' +  decoded['idreceiver'][1]
			else:
				print 'Answer from peer '+ decoded['idtransmitter'][1:-1] + ' to peer ' +  decoded['idreceiver'][1]

		if 'candidate' in decoded:
			print 'Candidate num: '+decoded['idtransmitter']

                sys.stdout.flush()
                        
		for client in self.server.connections.itervalues():
			#if client != self:
                        destination = decoded['idreceiver'][1:-1]
                        if client == peeridlist[int(destination)]:
                                try:
					client.sendMessage(str(self.data))
				except Exception as n:
					print n


	def handleConnected(self):
		global nextid, peeridlist, peerlist
		print self.address, 'connected'
                sys.stdout.flush()
                
		try:
			self.sendMessage(str('{"numpeer":"'+str(nextid)+'"}'))
			self.sendMessage(str('{"peerlist":"'+str(peerlist)+'"}'))
			peerlist.append(nextid)
			peeridlist[nextid]=self
			nextid=nextid+1
		except Exception as n:
			print n

	def handleClose(self):
                global peerlist, peeridlist, nextid
		print self.address, 'closed'
                peernumber = peeridlist.keys()[peeridlist.values().index(self)]
		peerlist.remove(peernumber);
                print 'Peer '+str(peernumber)+' deleted'
                sys.stdout.flush()

if __name__ == '__main__':
	nextid = 0
	peerlist=[]
	peeridlist={}
	server = SimpleWebSocketServer('', 9876, Signaling)
	server.serveforever()
