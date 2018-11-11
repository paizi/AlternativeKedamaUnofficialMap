import cv2
import numpy
import os

class PicScaleControl:
    def __init__(self, winW, winH, img):
        self.winW = int(winW)
        self.winH = int(winH)
        self.img = img
        self.w = self.img.shape[1]
        self.h = self.img.shape[0]
        self.scale0 = min(self.winW / self.w, self.winH / self.h, 1.0)
        self.scale = self.scale0
        self.mat = numpy.eye(3, dtype='float32');
    def update(self, scale=None, px=0, py=0):
        if not scale:
            scale = self.scale0
        self.mat[0,0] = scale
        self.mat[1,1] = scale
        self.mat[0,2] = px * (1 - scale / self.scale0)
        self.mat[1,2] = py * (1 - scale / self.scale0)
        return self.mat
    def show(self):
        return cv2.warpAffine(self.img, self.mat[:2,:] ,(self.winW, self.winH))
    def getXY(self, x, y):
        X = (numpy.float32([x, y, 1]).T - self.mat[:,2]) / self.mat[0, 0]
        return X[0], X[1]
        
    def callbackMouseWhell(self, event, x, y, flags, param):
        if event == cv2.EVENT_MOUSEWHEEL:
            if flags > 0:
                self.scale += 0.1
            else:
                self.scale -= 0.1
                if(self.scale < self.scale0):
                    self.scale = self.scale0
            self.update(self.scale, x, y)

def markCallback(event,x,y,flags,param):
    if event == cv2.EVENT_LBUTTONDOWN:
        x,y = param[1].getXY(x,y)
        param[0].append([x,y])
        print(param[0])
    elif event == cv2.EVENT_RBUTTONDOWN:
        param[0].pop()
        print(param[0])
    else:
        param[1].callbackMouseWhell(event,x,y,flags,param)
        

def openImg(args):
    img = cv2.imread(args[0])
    while True:
        cv2.imshow('image', img)
        if cv2.waitKey(20) & 0xFF == 27:
            break
    cv2.destroyAllWindows()
    return img

def mark(img):
    points = []
    ctr = PicScaleControl(img.shape[1]/2, img.shape[0]/2, img)
    ctr.update()
    cv2.namedWindow('image')
    cv2.setMouseCallback('image',markCallback, (points, ctr))
    while True:
        cv2.imshow('image', ctr.show())
        if cv2.waitKey(20) & 0xFF == 27:
            break
    cv2.destroyAllWindows()
    return numpy.float32(points)

def calibration(img, pts1, pts2):   
    M = cv2.getPerspectiveTransform(pts1,pts2)
    img = cv2.warpPerspective(img, M, (pts2[3][0],pts2[3][1]))
    while True:
        cv2.imshow('image', img)
        if cv2.waitKey(20) & 0xFF == 27:
            break
    cv2.destroyAllWindows()
    return img

def split(img, path, nx, ny):
    r,c,ch = img.shape
    imList = []
    x = 0
    nnx = int(nx)
    while x < c:
        y = 0
        nny = int(ny)
        while y < r:
            X = min(x + 512, c)
            Y = min(y + 512, r)
            part = img[y:Y,x:X]
            imList.append((nnx, nny, part))
            nny += 1
            y += 512
        nnx += 1
        x += 512
    for item in imList:
        fname = os.path.join(path, '%d,%d.png' % (item[0],item[1]))
        part = item[2]
        print(fname, part.shape)
        cv2.imwrite(fname, part)
    return

def main():
    img = None
    pic = None
    points = None
    while True:
        s = input('>> ')
        if s == '':
            break
        cmd = s.split(' ')
        if cmd[0] == 'open':
            img = openImg(cmd[1:])
            continue
        if cmd[0] == 'mark':
            points = mark(img)
            continue
        if cmd[0] == 'cal':
            n = int(cmd[1])
            p2 = numpy.float32([[0,0],[0,512*n],[512*n,0],[512*n,512*n]])
            pic = calibration(img, points, p2)
            continue
        if cmd[0] == 'save':
            cv2.imwrite(cmd[1], pic)
            continue
        if cmd[0] == 'split':
            if pic == None:
                pic = img
            split(pic, cmd[1], int(cmd[2]), int(cmd[3]))

if __name__ == '__main__':
    main()

s = r'F:\Games\Minecraft\.minecraft\screenshots\2018-11-06_00.10.57.png'
