import cv2
import numpy
import os
import re

from picHandler import PicScaleControl

class SplitMap:

    def __init__(self, w, h, maxZoom):
        self.z = int(maxZoom)
        r = 2  ** self.z
        self.tw = int(w / r)
        self.th = int(h / r)
        self.w = int(r * self.tw)
        self.h = int(r * self.th)
        self.map = numpy.empty([self.h, self.w, 4], 'uint8')

    def getRange(self, tileSize, tilePos):
        """
            @param  tileSize  (w,h)
            @param  tilePos   (ix, iy)
            @return dstRect=(r0,c0;r1,c1),srcRect=(r0,c0;r1,c1)
        """
        dstRect = numpy.int32([[self.h / 2, self.w / 2],[self.h / 2, self.w / 2]])
        srcRect = numpy.int32([[0,0],[tileSize[1], tileSize[0]]])
        dstRect = dstRect + srcRect
        dstRect[:,0] += numpy.int32(tileSize[1] * tilePos[1])
        dstRect[:,1] += numpy.int32(tileSize[0] * tilePos[0])
        d = numpy.int32([[0,0],[self.h,self.w]]) - dstRect
        d[0,:] = numpy.maximum(d[0,:], 0)
        d[1,:] = numpy.minimum(d[1,:], 0)
        dstRect += d
        srcRect += d
        if numpy.any(srcRect[0,:] >= srcRect[1,:]):
            return None
        return dstRect, srcRect
        
    
    def load(self, path, tileW=None, tileH=None):
        if not tileW:
            tileW = self.tw
        else:
            tileW = int(tileW)
        if not tileH:
            tileH = self.th
        else:
            tileH = int(tileH)
        pattern = re.compile(r'^(-[1-9]\d*|\d+),(-[1-9]\d*|\d+).png')
        for fname in os.listdir(path):
            fpath = os.path.join(path, fname)
            if os.path.isfile(fpath):
                m = pattern.match(fname)
                if not m:
                    print('@exclude: ', fpath)
                else:
                    x = int(m.group(1))
                    y = int(m.group(2))
                    part = cv2.imread(fpath, cv2.IMREAD_UNCHANGED)
                    if (tileH, tileW) == part.shape[:2]:
                        r = self.getRange((tileW, tileH), (x, y))
                        if r:
                            r = (r[0][0,0],r[0][1,0],r[0][0,1],r[0][1,1],r[1][0,0],r[1][1,0],r[1][0,1],r[1][1,1])
                            print('@load ', fpath, ' => ', r[:4])
                            if part.shape[2] == 3:
                                self.map[r[0]:r[1],r[2]:r[3],:3] = part[r[4]:r[5],r[6]:r[7],:]
                                self.map[r[0]:r[1],r[2]:r[3],3] = 255
                            else:
                                self.map[r[0]:r[1],r[2]:r[3],:4] = part[r[4]:r[5],r[6]:r[7],:]
                    else:
                        print('@exception[image size]: ', fpath) 
        return self.map

    def split(self, zoom):
        res = []
        r = 2 ** zoom
        if zoom == self.z:
            smap = self.map
        else:
            smap = cv2.resize(self.map, (self.tw * r, self.th * r))
        if zoom > 0:
            v = numpy.tile(numpy.arange(-r/2, r/2, 1, dtype='int32'), (r, 1))
            ind = numpy.zeros((6, r * r), dtype='int32')
            ind[0,:] = v.flatten('C') #ix
            ind[1,:] = v.flatten('F') #iy
            ind[2,:] = (ind[1,:] + r / 2) * self.th #r0
            ind[3,:] = (ind[0,:] + r / 2) * self.tw #c0
            ind[4,:] = ind[2,:] + self.th #r1
            ind[5,:] = ind[3,:] + self.tw #c1
            for i in ind.T:
                part = smap[i[2]:i[4],i[3]:i[5],:]
                if numpy.any(part):
                    res.append(('%d,%d.png' % (i[0], i[1]), part))
        else:
            th = self.th
            tw = self.tw
            sh, sw, channel = smap.shape
            sh = int(sh / 2)
            sw = int(sw / 2)           
            part = numpy.zeros([th, tw, channel], smap.dtype)
            part[th-sh:, tw-sw:, :] = smap[:sh, :sw, :]
            if numpy.any(part):
                res.append(('-1,-1.png', part))                
            part = numpy.zeros([th, tw, channel], smap.dtype)
            part[th-sh:, :sw, :] = smap[:sh, sw:, :]
            if numpy.any(part):
                res.append(('0,-1.png', part))                
            part = numpy.zeros([th, tw, channel], smap.dtype)
            part[:th-sh, tw-sw:, :] = smap[sh:, :sw, :]
            if numpy.any(part):
                res.append(('-1,0.png', part))               
            part = numpy.zeros([th, tw, channel], smap.dtype)
            part[:th-sh, :sw, :] = smap[sh:, sw:, :]
            if numpy.any(part):
                res.append(('0,0.png', part))                
        return res
    
    def update(self, path, picList):
        if not os.path.exists(path):
            os.makedirs(path)
        for picItem in picList:
            fname = os.path.join(path, picItem[0])
            pic = picItem[1]
            old = cv2.imread(fname, cv2.IMREAD_UNCHANGED)
            if (not old is None) and old.shape == pic.shape and numpy.equal(old, pic).all():
                print('@skip: ', fname)
            else:
                print('@save: ', fname, ' =', cv2.imwrite(fname, pic))
        
def show(ls):
    for u in ls:
        cv2.imshow(u[0], u[1]);

def close(ls):
    for u in ls:
        cv2.destroyWindow(u[0])

"""
def script(end, globalargs=None, localargs=None):
    incomplete = False
    scripts = ''
    while True:
        try:
            s = input('>>> ').rstrip()
            if s == end:
                break
            if s == '' and incomplete:
                incomplete = False
            elif s[-1] == ':':
                incomplete = True
            scripts += (s + '\n')
            if not incomplete:
                print(scripts)
                print(eval(scripts, globalargs, localargs))
                scripts = ''
        except Exception as e:
            print(e)
"""


def main():
    print(__package__)
    m = None
    while True:
        s = input('>> ')
        if s == '':
            break
        try:
            cmd = s.split()
            if cmd[0] == 'clear':
                m = None
                continue
            if cmd[0] == 'new':
                m = SplitMap(int(cmd[1]), int(cmd[2]), int(cmd[3]))
                print(m)
                continue
            if cmd[0] == 'load':
                tw = None
                th = None
                if len(cmd) > 2:
                    tw = int(cmd[2])
                    th = int(cmd[3])
                m.load(cmd[1], tw, th)
                tw = None
                th = None
                continue
            if cmd[0] == 'split':
                m.update(cmd[1], m.split(int(cmd[2])))
                continue
            if cmd[0] == 'splitAll':
                for zoom in range(m.z, -1, -1):
                    path = os.path.join(cmd[1], str(zoom))
                    m.update(path, m.split(zoom))
                continue
            if cmd[0] == 'save':
                cv2.imwrite(cmd[1], m.map)
                continue
        except Exception as e:
            print('Error:', e)
    return m

        
if __name__ == '__main__':
    main()
