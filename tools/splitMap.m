function [ patchs, alphas, indexs ] = splitMap( pic, alpha, maxZoom )
%   @bref       split and resample picture, for leaflets
%       @param  pic         input picture matrix (height x width x 3)
%       @param  maxZoom     max zoom level; `line num` = `coloumn num` = power(2, `zoom level`)

%       @return patchs      4-D matrix of parts (ph x pw), [picx, picy, color, index]
%                           pw = width / power(2, maxZoom)      ph = height / power(2, maxZoom)
%       @return indexs      index table: [zoom;x;y] <== index
    [h, w, ~] = size(pic);
    sp = pow2(maxZoom);
    ph = h / sp;
    pw = w / sp;
    if ceil(ph) > ph || ceil(pw) > pw
        ph = ceil(ph);
        pw = ceil(pw);
        pic(ph * sp, pw * sp, 3) = 0;
    end
    index = (1 - power(4, maxZoom + 1)) / (1 - 4);
    patchs = zeros(ph, pw, 3, index, 'uint8');
    alphas = zeros(ph, pw, index);
    indexs = zeros(3, index);
    index = 0;
    for z = 0 : maxZoom
        s = pow2(z);
        dh = h / s;
        dw = w / s;
        for x = 1 : s
            for y = 1 : s
                index = index + 1;
                if s < sp
                    patchs(:,:,:,index) = imresize(pic(1 + (y - 1) * dh : dh + (y - 1) * dh, 1 + (x - 1) * dw : dw + (x - 1) * dw, :), s / sp);
                    alphas(:,:,index) = imresize(alpha(1 + (y - 1) * dh : dh + (y - 1) * dh, 1 + (x - 1) * dw : dw + (x - 1) * dw), s / sp);
                else
                    patchs(:,:,:,index) = pic(1 + (y - 1) * dh : dh + (y - 1) * dh, 1 + (x - 1) * dw : dw + (x - 1) * dw, :);
                    alphas(:,:,index) = alpha(1 + (y - 1) * dh : dh + (y - 1) * dh, 1 + (x - 1) * dw : dw + (x - 1) * dw);
                end
                indexs(:,index) = [z, x-1, y-1];
            end
        end
    end    
end