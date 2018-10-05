clear
[pic, ~, alpha] = imread('..\data\main_v2_20180930.png');
pSize = 512;
maxZoom = 5;
mkdir part
cd part
for z = maxZoom : -1 : 0
    [height, width, c] = size(pic);
    hp = ceil(height / pSize / 2) * 2;
    wp = ceil(width / pSize / 2) * 2;
    if hp * pSize > height || wp * pSize > width
       npic = zeros(hp * pSize, wp * pSize, c, 'like', pic);
       nalpha = zeros(hp * pSize, wp * pSize, 'like', pic);
       dh = ceil((hp * pSize - height) / 2);
       dw = ceil((wp * pSize - width) / 2);
       npic(dh + 1 : dh + height, dw + 1 : dw + width, :) = pic;
       nalpha(dh + 1 : dh + height, dw + 1 : dw + width) = alpha;
       pic = npic;
       alpha = nalpha;
    end
    mkdir(sprintf('%d',z));
    for x = 0 : wp - 1
        for y = 0 : hp - 1
            ppic = pic(y * pSize + 1 : y * pSize + pSize, x * pSize + 1 : x * pSize + pSize, :);
            palpha = alpha(y * pSize + 1 : y * pSize + pSize, x * pSize + 1 : x * pSize + pSize);
            file = sprintf('%d\\%d,%d.png',z, x - wp / 2, y - hp / 2);
            if any(palpha(:) > 16)
                imwrite(ppic, file, 'Alpha', palpha);
                fprintf('saved [%s]\n', file);
            else
                fprintf('ignored [%s]\n', file);
            end
        end
    end
    pic = imresize(pic, 0.5);
    alpha = imresize(alpha, 0.5);
end
cd ..\
clear