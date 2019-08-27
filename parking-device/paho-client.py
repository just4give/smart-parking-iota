import paho.mqtt.client as paho
import json
import time

def on_connect(client, userdata, flags, rc):
    print("CONNACK received with code ")
    client.connected_flag=True

print("hello")
paho.Client.connected_flag=False
client = paho.Client("hello")
client.on_connect = on_connect
#client.loop_start()
client.connect("localhost", 12883)
while not client.connected_flag: #wait in loop
    print("In wait loop")
    time.sleep(1)
mock={
    'id':2,'status':1
}
client.publish('iota/parking',json.dumps(mock))