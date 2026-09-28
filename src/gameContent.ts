export type SceneId='overview'|'station'; export type Phase=0|1|2|3; export type ObjectId='photo'|'phone'|'mirror'|'bed'|'notebook'|'computer'|'rules'
export type Investigation={id:ObjectId;scene:SceneId;label:string;observations:[string,string,string]}
export const investigations:Record<ObjectId,Investigation>={
 photo:{id:'photo',scene:'station',label:'调查照片',observations:['刚开学时拍的。最右边那个是我。','右边怎么有个人影……当时应该没拍到别人吧。','最右边……那还是我吗？']},
 phone:{id:'phone',scene:'station',label:'查看手机',observations:['她们两个今晚都不回来。','没什么新消息。','……我明明说的是现在回宿舍。']},
 mirror:{id:'mirror',scene:'station',label:'观察镜子',observations:['镜子里映出的，和平时没什么不同。','刚刚那里……是不是有什么？难道是我看错了？','刚才明明看到了……（回头看了一眼什么都没有）看来，我真的太困了。']},
 bed:{id:'bed',scene:'overview',label:'查看室友',observations:['她在上铺睡得很沉。','还是睡得很沉。','她翻了个身，没有醒。']},
 notebook:{id:'notebook',scene:'station',label:'翻看笔记',observations:['我下午上课记的笔记。','奇怪，笔记本怎么多了几行字。','下面的笔记怎么变成这样了，这也不是我的字啊。']},
 computer:{id:'computer',scene:'station',label:'查看电脑',observations:['我的科研报告还开着。刚才忘记关了。','摄影作品集？我什么时候做过这个？','这桌面怎么变成这样了……等等，这是谁的微信？']},
 rules:{id:'rules',scene:'station',label:'查看纸条',observations:['不知道是谁贴在这里的，怪怪的。','镜中浮现，终成现实……什么意思？','等等，这句话好像说的是真的……']}
}
export const observation=(id:ObjectId,phase:Phase)=>investigations[id].observations[Math.min(phase,2)]
export const closeupAsset=(id:ObjectId,phase:Phase)=>`/assets/closeups/${id}_${['2355','0000','0005'][Math.min(phase,2)]}.png`
