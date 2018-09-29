%% 
clear
[pic, ~, alpha] = imread('F:\Games\Minecraft\About\v2_主世界_day_2018-06-10.png');
[patchs, alphas, indexs] = splitMap(pic, alpha, 5);
[h,w,c,n] = size(patchs);
clear alpha
%% 
for z = 1 : n
    pic = patchs(:,:,:,z);
    alpha = alphas(:,:,z);
    
    ind = indexs(:,z);
    name = sprintf('v2/part-%d-%d-%d.png', ind(1), ind(2), ind(3));
	imshow(pic);
    title(name);
    if all(alpha == 0)
        
    else
        try
            [op, ~, oa] = imread(name);
        catch e
            op = zeros(h, w, c, 'uint8');
            oa = zeros(h, w, c, 'uint8');
        end
        if all(op(:) == pic(:))
            
        else
            fprintf('%s\n',name);
            imwrite(pic, name, 'alpha', alpha);
        end      
    end
end


%%
%%
clear
[pic, ~, alpha] = imread('F:\Games\Minecraft\About\v2_主世界_day_2018-06-10.png');
%%
imshow(pic);
%%
[x,y] = ginput(2);
x = sort(int32(x));
y = sort(int32(y));
imshow(pic(y(1):y(2),x(1):x(2),:));


%%
h = 512;
w = 512;
pic = zeros(h, w, 3, 'uint8');
alpha = zeros(h, w, 'uint8');



color = zeros(1, 1, 3, 'uint8');
color(:) = [78, 230, 180];
for n = 1 : 100 : h
   pic(n, 1:w, 2) = 200;
   alpha(n, 1:w) = 255;
end
color(:) = [78, 30, 180];
for n = 6 : 50 : w
   pic(1:h, n, 1) = 200;
   alpha(1:w, n) = 255;
end
imwrite(pic, 'testNet.png', 'Alpha', alpha);


%%
clear
mask = load('banner_icon_mask.mat');
for n = 1 : size(mask.colors, 2)
	fc = mask.colors(:,n); 
    ec = floor(fc * 0.5);
    sc = [99; 77; 50];
    [pic, a] = bannerIcon(mask, sc, fc, ec, 254);
    name = sprintf('banner_icon_%d.png', n);
    imwrite(pic, name, 'Alpha' ,a);
end


%%
clear
open('../data/v2/updates.csv');
%%
c = 1;
for n = 1 : length(updates)
	file = updates{n};
    [pic, ~, alpha] = imread(file);
    imshow(alpha)
    title(num2str(n));
    pause(1);
end