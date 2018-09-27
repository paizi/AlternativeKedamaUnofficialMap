function [ pic, alpha ] = bannerIcon( mask, stickColor, faceColor, edgeColor , alpha_t)
    pic = mask.pic;
    alpha = mask.alpha;
    for c = 1 : 3
        pic(:,:,c) = uint8(mask.stick) * stickColor(c) + uint8(mask.face) * faceColor(c) + uint8(mask.edge) * edgeColor(c);
    end
    u = mask.edge | mask.face | mask.stick;
    alpha(u) = alpha_t;
end

