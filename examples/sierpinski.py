# events-example0.py
# Barebones timer, mouse, and keyboard events

from tkinter import *
import math
import urllib.request
import json

####################################
# customize these functions
####################################

url = sys.argv[1]

def init(data):
    # load data.xyz as appropriate

    decoded = urllib.request.urlopen(url).read().decode('utf-8')
    a = json.loads(decoded)

    data.backgroundColor = "white"
    data.x = 50
    data.y = 950
    data.size = 900
    data.level = math.floor(a["v"] / 12.5)
    pass

def mousePressed(event, data):
    # use event.x and event.y
    pass

def keyPressed(event, data):
    # use event.char and event.keysym
    pass

def timerFired(data):
    decoded = urllib.request.urlopen(url).read().decode('utf-8')
    a = json.loads(decoded)

    data.level = math.floor(a["v"] / 12.5)
    pass

def sierpinski(canvas, x, y, size, level):
    x = float(x)
    y = float(y)
    # base case: a Sierpinsky triangle at level 0
    # is just a solid triangle
    if (level == 0):
        canvas.create_polygon(x, y, x+size, y,
                              x+size/2, y-size*math.sqrt(3)/2,
                              fill="green")
    # recursive case: shrink the previous level of Sierpinski
    # triangle, and repeat it three times
    else:
        sierpinski(canvas, x, y, size/2, level-1)
        sierpinski(canvas, x+size/2, y, size/2, level-1)
        sierpinski(canvas, x+size/4, y-size*math.sqrt(3)/4,
                   size/2, level-1)


def redrawAll(canvas, data):
    canvas.create_rectangle(0,0,data.width,data.height,fill=data.backgroundColor)
    sierpinski(canvas,data.x,data.y,data.size,data.level)
    # draw in canvas
    pass

####################################
# use the run function as-is
####################################

def run(width=300, height=300):
    def redrawAllWrapper(canvas, data):
        canvas.delete(ALL)
        canvas.create_rectangle(0, 0, data.width, data.height,
                                fill='white', width=0)
        redrawAll(canvas, data)
        canvas.update()

    def mousePressedWrapper(event, canvas, data):
        mousePressed(event, data)
        redrawAllWrapper(canvas, data)

    def keyPressedWrapper(event, canvas, data):
        keyPressed(event, data)
        redrawAllWrapper(canvas, data)

    def timerFiredWrapper(canvas, data):
        timerFired(data)
        redrawAllWrapper(canvas, data)
        # pause, then call timerFired again
        canvas.after(data.timerDelay, timerFiredWrapper, canvas, data)
    # Set up data and call init
    class Struct(object): pass
    data = Struct()
    data.width = width
    data.height = height
    data.timerDelay = 100 # milliseconds
    init(data)
    # create the root and the canvas
    root = Tk()
    canvas = Canvas(root, width=data.width, height=data.height)
    canvas.pack()
    # set up events
    root.bind("<Button-1>", lambda event:
                            mousePressedWrapper(event, canvas, data))
    root.bind("<Key>", lambda event:
                            keyPressedWrapper(event, canvas, data))
    timerFiredWrapper(canvas, data)
    # and launch the app
    root.mainloop()  # blocks until window is closed
    print("bye!")

run(1000, 1000)
