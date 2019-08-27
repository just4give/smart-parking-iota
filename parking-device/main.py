from picamera import PiCamera
from os import system
from time import sleep
import RPi.GPIO as GPIO
import time
import requests
import base64
import json
import cv2
import numpy as np
import paho.mqtt.client as paho
import uuid
import boto3

s3_client = boto3.client('s3')
camera = PiCamera()
camera.resolution = (500, 500)
camera.rotation = 180

def on_connect(client, userdata, flags, rc):
    print("Connected to local mqtt broker")
    client.connected_flag=True

def on_message(client, userdata, message):
    if message.topic == '/payment/success':
        turnOnRedLight()

paho.Client.connected_flag=False
broker = 'localhost'
port = 12883
client = paho.Client()
client.loop_start()
client.on_connect = on_connect
client.connect(broker,port)
while not client.connected_flag:
    time.sleep(1)
client.subscribe('/payment/success')
client.on_message=on_message

GPIO.setmode(GPIO.BCM)
GPIO_TRIGGER = 18
GPIO_ECHO = 24 
RED_LIGHT = 9
AMBER_LIGHT = 10
GREEN_LIGHT = 11
#set GPIO direction (IN / OUT)
GPIO.setup(GPIO_TRIGGER, GPIO.OUT)
GPIO.setup(GPIO_ECHO, GPIO.IN)
GPIO.setup(RED_LIGHT, GPIO.OUT)
GPIO.setup(AMBER_LIGHT, GPIO.OUT)
GPIO.setup(GREEN_LIGHT, GPIO.OUT)

occupied = False
ALPR_SECRET_KEY = 'xxx'




def turnOffLights():
    GPIO.output(RED_LIGHT, False)
    GPIO.output(AMBER_LIGHT, False)
    GPIO.output(GREEN_LIGHT, False)
    
def turnOnRedLight():
    GPIO.output(RED_LIGHT, True)
    GPIO.output(AMBER_LIGHT, False)
    GPIO.output(GREEN_LIGHT, False)

def turnOnAmberLight():
    GPIO.output(RED_LIGHT, False)
    GPIO.output(AMBER_LIGHT, True)
    GPIO.output(GREEN_LIGHT, False)

def turnOnGreenLight():
    GPIO.output(RED_LIGHT, False)
    GPIO.output(AMBER_LIGHT, False)
    GPIO.output(GREEN_LIGHT, True)

def distance():
    # set Trigger to HIGH
    GPIO.output(GPIO_TRIGGER, True)
 
    # set Trigger after 0.01ms to LOW
    time.sleep(0.00001)
    GPIO.output(GPIO_TRIGGER, False)
 
    StartTime = time.time()
    StopTime = time.time()
 
    # save StartTime
    while GPIO.input(GPIO_ECHO) == 0:
        StartTime = time.time()
 
    # save time of arrival
    while GPIO.input(GPIO_ECHO) == 1:
        StopTime = time.time()
 
    # time difference between start and arrival
    TimeElapsed = StopTime - StartTime
    # multiply with the sonic speed (34300 cm/s)
    # and divide by 2, because there and back
    distance = (TimeElapsed * 34300) / 2
 
    return distance

def detectLicensePlate():
    PLATE=None
    print("Capturing image...")
    camera.capture('image.jpg')
    with open('image.jpg', 'rb') as image_file:
        img_base64 = base64.b64encode(image_file.read())
    
    url = 'https://api.openalpr.com/v2/recognize_bytes?recognize_vehicle=1&country=us&secret_key=%s' % (ALPR_SECRET_KEY)
    r = requests.post(url, data = img_base64)
    
    objects=r.json()['results']
    objects = sorted(objects, key=lambda k: k['confidence'], reverse=True)
    
    if len(objects) > 0:
        PLATE = objects[0]['plate']
        print ("Plate found = %s " % PLATE)
        arr2=[]
        for obj in objects[0]['coordinates']:
            arr1=[obj['x'],obj['y']]
            arr2.append(arr1)

        img = cv2.imread('image.jpg',cv2.IMREAD_COLOR)
        pts = np.array(arr2, np.int32)
        pts = pts.reshape((-1,1,2))
        cv2.polylines(img, [pts], True, (0,255,0), 3)
        cv2.imwrite('image2.jpg',img)
        initiatePayment(PLATE)

    else:
        print("This is not a car")
    return PLATE

def initiatePayment(plate):
    key = "{rand}.jpg".format(rand=str(uuid.uuid4()))
    s3_client.upload_file('image2.jpg', 'spsiota', key)
    mock={'plateNo':plate,'s3Key':key}
    client.publish('/intiate/payment',json.dumps(mock))


if __name__ == '__main__':
    try:
        
        turnOffLights()
        while True:
            dist = distance()
            print ("Measured Distance = %.1f cm" % dist)
            time.sleep(1)
            if dist < 10:
                if occupied == False:
                    turnOnAmberLight()
                    occupied = True
                    client.publish('/space/occupied',json.dumps({'occupied':occupied}))
                    #print("published occupied to broker")
                    detectLicensePlate()
                
            else:
                if occupied == True:
                    occupied = False
                    client.publish('/space/occupied',json.dumps({'occupied':occupied}))
                    turnOnGreenLight()

 
        # Reset by pressing CTRL + C
    except KeyboardInterrupt:
        print("Measurement stopped by User")
        GPIO.cleanup()

