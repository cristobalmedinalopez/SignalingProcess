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

                msg = decoded['control'][1:-1]
                pid = decoded['id'][1:-1]
                nick = decoded['nickname'][1:-1]
                teamsize = decoded['teamsize'][1:-1]
                
                f = open("data/"+teamsize+"_"+pid+"_"+nick,'a')
                f.write(time.strftime("%c")+':\n')
                f.write(msg+'\n')
                f.close()


	def handleConnected(self):
		print self.address, 'connected'
                sys.stdout.flush()

	def handleClose(self):
		print self.address, 'closed'
                sys.stdout.flush()

                
if __name__ == '__main__':
	server = SimpleWebSocketServer('', 9866, Signaling)
	server.serveforever()

