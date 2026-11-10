// node tools/build_wave_hd.cjs [path-to-sharp]
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.argv[2] || 'sharp');
const root = path.resolve(__dirname, '..');
(async()=>{
  const {data:source,info}=await sharp(path.join(root,'art/standing-source.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let i=3;i<source.length;i+=4)if(source[i]<128)source[i]=0;
  const clean=await sharp(source,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
  const trimmed=await sharp(clean).trim().toBuffer({resolveWithObject:true});
  const side=Math.ceil(trimmed.info.height*812/493);
  const dx=Math.floor((side-trimmed.info.width)/2)+trimmed.info.trimOffsetLeft;
  const dy=Math.round(side*654/812)-trimmed.info.height+trimmed.info.trimOffsetTop;
  const patch={x:64,y:440,width:386,height:600};
  const canvasPatch={x:patch.x+dx,y:patch.y+dy,width:patch.width,height:patch.height};
  const base=await sharp(path.join(root,'assets/standing-hd.webp')).ensureAlpha().raw().toBuffer();
  const original=Buffer.alloc(patch.width*patch.height*4);
  for(let y=0;y<patch.height;y++)for(let x=0;x<patch.width;x++){
    const from=((canvasPatch.y+y)*side+canvasPatch.x+x)*4,to=(y*patch.width+x)*4;base.copy(original,to,from,from+4);
  }
  const partFile=path.join(root,'art/cycles/source/wave-hd-arm.png');
  const pm=await sharp(partFile).metadata(),cw=Math.floor(pm.width/4),ch=Math.floor(pm.height/3);
  const poses=[null,1,2,3,4,5,6,7,8,10,0,null],frames=[];
  for(let i=0;i<12;i++){
    let pixels=Buffer.from(original);
    if(poses[i]!==null){
      for(let y=0;y<patch.height;y++)for(let x=0;x<patch.width;x++) {
        const sx=x+patch.x, sy=y+patch.y, p=(y*patch.width+x)*4;
        const olive=original[p+1]>original[p]*.75 && original[p+2]<original[p]*.80;
        const bodyEdge=sy>=800?374:382;
        if(sx>=230 && sx<bodyEdge && sy>=480 && sy<1010 && !olive)pixels.fill(0,p,p+4);
      }
      const f=poses[i];
      const cut=await sharp(partFile).extract({left:f%4*cw,top:Math.floor(f/4)*ch,width:cw,height:ch}).png().toBuffer();
      const {data:limb,info:li}=await sharp(cut).resize(Math.round(cw*1.42),Math.round(ch*1.42),{kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      const ox=Math.round(420-300*1.42)-patch.x,oy=Math.round(500-15*1.42)-patch.y;
      for(let y=0;y<li.height;y++)for(let x=0;x<li.width;x++){
        const tx=x+ox,ty=y+oy,from=(y*li.width+x)*4;
        if(tx<0||ty<0||tx>=patch.width||ty>=patch.height||limb[from+3]<128)continue;
        limb.copy(pixels,(ty*patch.width+tx)*4,from,from+4);
      }
      // Keep the torso/backpack join exactly as drawn in the approved still.
      for(let y=0;y<patch.height;y++)for(let x=(y+patch.y>=800?374:382)-patch.x;x<patch.width;x++){
        const p=(y*patch.width+x)*4;original.copy(pixels,p,p,p+4);
      }
    }
    frames.push(await sharp(pixels,{raw:{width:patch.width,height:patch.height,channels:4}}).png().toBuffer());
  }
  await sharp({create:{width:patch.width*4,height:patch.height*3,channels:4,background:'#00000000'}})
    .composite(frames.map((input,i)=>({input,left:i%4*patch.width,top:Math.floor(i/4)*patch.height})))
    .webp({lossless:true}).toFile(path.join(root,'assets/cycles/wave-hd.webp'));
  fs.writeFileSync(path.join(root,'assets/cycles/wave-hd.json'),JSON.stringify({
    image:'wave-hd.webp',frames:12,columns:4,frameWidth:patch.width,frameHeight:patch.height,
    canvasWidth:side,canvasHeight:side,patch:{x:canvasPatch.x,y:canvasPatch.y},
    base:'../standing-hd.webp',clear:[canvasPatch],frameMs:130,
    sequence:poses.map((_,frame)=>({frame,durationMs:frame===0?180:frame>=9?160:130})),
  },null,2)+'\n');
  console.log({side,sourceTranslation:[dx,dy],patch:canvasPatch,frames:12,matchingRestEndpoints:true});
})();
