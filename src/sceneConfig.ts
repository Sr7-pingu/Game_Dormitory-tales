import type { ObjectId } from './gameContent'
export type SceneId='overview'|'station'
export type Hotspot={id:string;object?:ObjectId;x:number;y:number;width:number;height:number;tooltip:string;kind?:'main'|'env'|'nav';observation?:string}
export const scenes:Record<SceneId,{asset:string;alt:string;hotspots:Hotspot[]}>= {
 overview:{asset:'/assets/dorm_overview_2355.png',alt:'深夜的四人大学宿舍总览',hotspots:[
  {id:'bed',object:'bed',x:72,y:5,width:25,height:25,tooltip:'查看室友',kind:'main'},
  {id:'station',x:6,y:33,width:25,height:34,tooltip:'走近自己的位置',kind:'nav'}]},
 station:{asset:'/assets/player_station_rules_note.png',alt:'玩家的上床下桌床位',hotspots:[
  {id:'photo',object:'photo',x:43,y:27,width:10,height:10,tooltip:'调查照片',kind:'main'},
  {id:'phone',object:'phone',x:28.7,y:66.2,width:7.2,height:4.5,tooltip:'查看手机',kind:'main'},
  {id:'mirror',object:'mirror',x:10.4,y:23.4,width:12.7,height:40.5,tooltip:'观察镜子',kind:'main'},
  {id:'notebook',object:'notebook',x:39.6,y:65.6,width:21.8,height:6.6,tooltip:'翻看笔记',kind:'main'},
  {id:'computer',object:'computer',x:41.5,y:50.2,width:15,height:16.2,tooltip:'查看电脑',kind:'main'},
  {id:'rules',object:'rules',x:11.4,y:64.6,width:6.1,height:9.8,tooltip:'查看纸条',kind:'main'},
  {id:'lamp',x:31,y:42,width:8,height:15,tooltip:'看看台灯',kind:'env',observation:'这学期新买的。很喜欢这个光的色调。'},
  {id:'books',x:26,y:22,width:9,height:15,tooltip:'看看书架',kind:'env',observation:'这学期的书。已经开始有点放不下了。'},
  {id:'rabbit',x:37,y:28,width:5,height:10,tooltip:'看看玩偶',kind:'env',observation:'一直放在这里的小兔子。'},
  {id:'headphones',x:66.5,y:42.4,width:5,height:16,tooltip:'看看耳机',kind:'env',observation:'昨晚刚充过电。'},
  {id:'mug',x:62,y:30,width:4.5,height:6,tooltip:'看看杯子',kind:'env',observation:'杯底还留着一点水。'},
  {id:'wallPhotos',x:72,y:25,width:6,height:27,tooltip:'看看照片',kind:'env',observation:'平时随手拍的一些照片。'},
  {id:'blanket',x:36,y:69,width:31,height:30,tooltip:'拿起毛毯',kind:'nav'}]}
}
export const closeupAsset=(_id:ObjectId,_phase:number)=>'/assets/closeup_placeholder.svg'
export const requiredCloseups=['photo_2355','photo_0000','photo_0005','phone_2355','phone_0005','mirror_2355','mirror_0000','mirror_0005','bed_2355','bed_0005','notebook_2355','notebook_0005','computer_2355','computer_0005','rules_2355','rules_0000','rules_0005']
