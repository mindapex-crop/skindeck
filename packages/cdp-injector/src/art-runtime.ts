/**
 * art-runtime.ts
 * ---------------------------------------------------------------------------
 * 生成一段注入到目标渲染进程里的 IIFE：加载背景图 -> 缩到 96px canvas ->
 * getImageData -> 内联分析算法（与 image-analysis.ts 的 analyzePixels 等价）
 * -> 把 焦点/安全区/主题色 写成 CSS 变量与 data 属性，供 theme-injector 的
 * CSS 通过 var(--skins-art-*) 消费，实现"换图即自动贴合 + 自动配色"。
 *
 * 注意：用 CDP evaluate 注入的是纯字符串，所以分析算法必须内联成 JS 文本，
 * 不能 import TS 模块。运行时若遇到 canvas 跨域污染(CORS)会静默降级，保留
 * theme.json 里写死的焦点/颜色。
 * ---------------------------------------------------------------------------
 */

/** 内联到页面里的分析算法（纯 JS，等价于 image-analysis.analyzePixels）。 */
const ANALYZER_SRC = `
(function analyze(data, width, height){
  if(!width||!height||data.length<4){
    return {accentRgb:{r:120,g:160,b:200},focusX:0.72,focusY:0.5,safeArea:'left',taskMode:'ambient',avgLuminance:128};
  }
  var bins=[]; for(var k=0;k<24;k++){bins.push({w:0,r:0,g:0,b:0});}
  var lumSum=0,lumCount=0,i,len=data.length;
  for(i=0;i<len;i+=4){var r=data[i],g=data[i+1],b=data[i+2];lumSum+=0.2126*r+0.7152*g+0.0722*b;lumCount++;}
  var lumMean=lumCount>0?lumSum/lumCount:128;
  var leftInfo=0,rightInfo=0,leftCount=0,rightCount=0,fx=0,fy=0,fW=0;
  function hue(r,g,b){var max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;if(d===0)return 0;var h;if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360;return h;}
  for(i=0;i<len;i+=4){
    var idx=i/4,px=idx%width,py=Math.floor(idx/width),x=px/width,y=py/height;
    var rr=data[i],gg=data[i+1],bb=data[i+2];
    var lum=0.2126*rr+0.7152*gg+0.0722*bb;
    var max=Math.max(rr,gg,bb),min=Math.min(rr,gg,bb);
    var sat=max===0?0:(max-min)/max;
    var info=Math.abs(lum-lumMean)*0.58+sat*0.42;
    if(x<0.5){leftInfo+=info;leftCount++;}else{rightInfo+=info;rightCount++;}
    var sal=0.01+Math.abs(lum-lumMean)*0.48+sat*0.34+(sat>0.5?0.28:0);
    fx+=x*sal;fy+=y*sal;fW+=sal;
    if(sat>0.25){var h=hue(rr,gg,bb);var b2=Math.min(23,Math.floor(h/15));var o=bins[b2];o.w+=1+sat;o.r+=rr;o.g+=gg;o.b+=bb;}
  }
  var focusX=fW>0?fx/fW:0.5,focusY=fW>0?fy/fW:0.5;
  var li=leftInfo/Math.max(1,leftCount),ri=rightInfo/Math.max(1,rightCount),safeArea='left';
  if(ri<li*0.86)safeArea='right';else if(li<ri*0.86)safeArea='left';else safeArea='left';
  var finalFocusX=safeArea==='left'?Math.max(focusX,0.64):Math.min(focusX,0.36);
  var best=0,bestW=-1;for(var m=0;m<24;m++){if(bins[m].w>bestW){bestW=bins[m].w;best=m;}}
  var bin=bins[best];
  var accent=bin.w>0?{r:Math.round(bin.r/bin.w),g:Math.round(bin.g/bin.w),b:Math.round(bin.b/bin.w)}:{r:120,g:160,b:200};
  return {accentRgb:accent,focusX:finalFocusX,focusY:focusY,safeArea:safeArea,taskMode:'ambient',avgLuminance:lumMean};
})
`;

export interface ArtRuntimeOptions {
  /** 背景图 URL（与注入 CSS 用的是同一张）。 */
  imageUrl: string;
  /** 失败时是否把强调色也写进 --skins-art-accent（自动配色）。默认 true。 */
  applyAccent?: boolean;
}

/**
 * 生成页面内运行的 IIFE 字符串。
 */
export function buildArtRuntimeScript(opts: ArtRuntimeOptions): string {
  const imgJson = JSON.stringify(opts.imageUrl);
  const applyAccent = opts.applyAccent ?? true;

  return `
(function () {
  try {
    var url = ${imgJson};
    if (!url) return;
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      try {
        var W = 96;
        var ratio = (img.naturalHeight && img.naturalWidth) ? img.naturalHeight / img.naturalWidth : 0.5625;
        var H = Math.max(1, Math.round(W * ratio));
        var cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        var ctx = cv.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, W, H);
        var data = ctx.getImageData(0, 0, W, H).data;
        var res = (${ANALYZER_SRC})(data, W, H);
        var root = document.documentElement;
        root.style.setProperty('--skins-art-focus-x', (res.focusX * 100).toFixed(2) + '%');
        root.style.setProperty('--skins-art-focus-y', (res.focusY * 100).toFixed(2) + '%');
        root.setAttribute('data-skins-art-safe', res.safeArea);
        root.setAttribute('data-skins-art-mode', res.taskMode);
        root.style.setProperty('--skins-art-accent', 'rgb(' + res.accentRgb.r + ',' + res.accentRgb.g + ',' + res.accentRgb.b + ')');
      } catch (e) { /* tainted canvas / CORS: 保留 theme.json 的值 */ }
    };
    img.onerror = function () {};
    img.src = url;
  } catch (e) {}
})();
`;
}
