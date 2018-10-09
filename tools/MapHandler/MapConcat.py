# -*- coding: utf-8 -*-

import os
import cv2
import re

class MapConcat:
    """description of class"""

    def __init__(self, **kwargs):
        self.pathFormat = ()

    def parseFormat(format):
        """
        format like `path/to/{z}/{x},{y}.png`
        """
        p = re.compile(r'\{([xyz])\}')        
        format = os.path.abspath(format)
        index = 0
        patterns = []
        for m in p.finditer(format):
            patterns.append(format[index:m.start()]);
            patterns.append(tuple(m.group(1)))
            index = m.end()
        patterns.append(format[index:])
        return patterns

    def generateFormat(patterns, **kwargs):
        path = ''
        for e in patterns:
            if type(e)
  
