import { useEffect, useRef, useState } from 'react'
import './index.css'
import './interaction-overrides.css'
import { observation, type ObjectId, type Phase } from './gameContent'
import { scenes, type SceneId } from './sceneConfig'

const times = ['23:55', '00:00', '00:05', '00:10']
const mainObjects = new Set<ObjectId>(['photo', 'phone', 'computer', 'notebook', 'rules', 'mirror'])
const DEBUG = new URLSearchParams(window.location.search).get('debug') === '1'
const BGM_ENABLED = import.meta.env.VITE_BGM_ENABLED !== 'false'
const introText = `最近几天，我总觉得宿舍里的镜子有些奇怪。

尤其是过了午夜。
有时候余光里，好像能看到镜子里有一道影子一闪而过。

可每次回头看看宿舍，明明什么都没有。
再看镜子，那道影子也不见了。

……可能只是最近太累了吧。`
const instructionsText = `今晚，你可以进行三轮调查

留意宿舍里的物品
有些东西或许并不会一直保持原样

当时间来到 00:10，你需要做出最终行动
否则现在的一切，就再也回不来了`
const successEndingText = 'Success\nYOU HAVE STOPPED THE REPLACEMENT'
const failureEndingText = 'Fail\nYOU HAVE BEEN REPLACED'
const storyText = '镜子的另一端，存在着另一个世界。\n\n那里的人渴望来到现实，却没有属于他们的位置。\n\n想要进入这个世界，他们必须取代一个现实中的人。\n\n镜子，是他们唯一的媒介。\n\n他们会在镜中浮现，观察现实中的人，学习他们的生活习惯，模仿他们的一切。\n\n笔记本里的字迹、相框里的陌生人、电脑里的陌生文件、聊天记录里的陌生表达、镜子里的黑影……\n\n这些都不是偶然。\n\n而是他们逐渐靠近现实的痕迹。\n\n“看得越仔细，时间过得越快。”\n\n因为每一次注视镜子，都是一次连接。\n\n如果没有被发现，镜中的倒影最终会成为现实。\n\n而这一次，你在它完成替代之前，阻止了这一切。\n\n（游戏剧情纯属虚构，仅供娱乐）'
const roommateAssets = {
  '2355': '/assets/investigations/roommate_2355.png',
  '0000': '/assets/investigations/roommate_2355.png',
  '0005': '/assets/investigations/roommate_0005.png',
} as const
const roommateAsset = (phase: Phase) => roommateAssets[['2355', '0000', '0005'][Math.min(phase, 2)] as keyof typeof roommateAssets]
const photoAssets = {
  '2355': '/assets/investigations/photo_2355.png',
  '0000': '/assets/investigations/photo_0000.png',
  '0005': '/assets/investigations/photo_0005.png',
} as const
const photoAsset = (phase: Phase) => photoAssets[['2355', '0000', '0005'][Math.min(phase, 2)] as keyof typeof photoAssets]
const phoneAssets = { '2355': '/assets/investigations/phone_2355.png', '0000': '/assets/investigations/phone_2355.png', '0005': '/assets/investigations/phone_0005.png' } as const
const phoneAsset = (phase: Phase) => phoneAssets[['2355', '0000', '0005'][Math.min(phase, 2)] as keyof typeof phoneAssets]
const computerAssets = { '2355': '/assets/investigations/computer_2355.png', '0000': '/assets/investigations/computer_0000.png', '0005': '/assets/investigations/computer_0005.png' } as const
const computerAsset = (phase: Phase) => computerAssets[['2355', '0000', '0005'][Math.min(phase, 2)] as keyof typeof computerAssets]
const mirrorAssets = { '2355': '/assets/investigations/mirror_2355.jpg', '0000': '/assets/investigations/mirror_0000.jpg', '0005': '/assets/investigations/mirror_0005.jpg' } as const
const mirrorAsset = (phase: Phase) => mirrorAssets[['2355', '0000', '0005'][Math.min(phase, 2)] as keyof typeof mirrorAssets]
const notebookAssets = { '2355': '/assets/investigations/notebook_2355.png', '0000': '/assets/investigations/notebook_0000.png', '0005': '/assets/investigations/notebook_0005.png' } as const
const notebookAsset = (phase: Phase) => notebookAssets[['2355', '0000', '0005'][Math.min(phase, 2)] as keyof typeof notebookAssets]
const finalActionOptions: Partial<Record<ObjectId, Array<{ label: string; correct?: boolean; feedback?: string }>>> = {
  mirror: [
    { label: '收进柜子', correct: true },
    { label: '打碎镜子', feedback: '镜子的碎裂声吵醒了舍友。\n碎裂的镜面映出更多奇怪的黑色影子' },
  ],
  computer: [{ label: '删除未知文件', feedback: '文件消失了。\n但好像并没有改变什么' }],
  notebook: [{ label: '撕掉异常页面', feedback: '我的笔记也没了。\n可那种奇怪的感觉还在' }],
  photo: [{ label: '取下照片', feedback: '照片取下来了。\n房间里却没有任何变化' }],
  phone: [{ label: '删除聊天记录', feedback: '聊天记录删掉了。\n但好像并没有什么用' }],
}

export default function App() {
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [mode, setMode] = useState<'title' | 'intro' | 'instructions' | 'playing'>('title')
  const [titleLeaving, setTitleLeaving] = useState(false)
  const [introLeaving, setIntroLeaving] = useState(false)
  const [introChars, setIntroChars] = useState(0)
  const [instructionChars, setInstructionChars] = useState(0)
  const [scene, setScene] = useState<SceneId>('overview')
  const [phase, setPhase] = useState<Phase>(0)
  const [actions, setActions] = useState(0)
  const [selected, setSelected] = useState<ObjectId | null>(null)
  const [environmental, setEnvironmental] = useState<string | null>(null)
  const [held, setHeld] = useState(false)
  const [notice, setNotice] = useState('')
  const [flicker, setFlicker] = useState(false)
  const [ending, setEnding] = useState<'good' | 'bad' | null>(null)
  const [locked, setLocked] = useState(false)
  const [covered, setCovered] = useState(false)
  const [inspectedAt, setInspectedAt] = useState<Partial<Record<ObjectId, Phase>>>({})
  const [pendingPhase, setPendingPhase] = useState<Phase | null>(null)
  const [fadingDot, setFadingDot] = useState<number | null>(null)
  const [finalIntro, setFinalIntro] = useState(false)
  const [finalChoice, setFinalChoice] = useState<ObjectId | null>(null)
  const [finalFeedback, setFinalFeedback] = useState<string | null>(null)
  const [finalFailed, setFinalFailed] = useState(false)
  const [finalSuccess, setFinalSuccess] = useState(false)
  const [successScene, setSuccessScene] = useState(false)
  const [successMessage, setSuccessMessage] = useState(false)
  const [endingChars, setEndingChars] = useState(0)
  const [storyOpen, setStoryOpen] = useState(false)
  const [storyChars, setStoryChars] = useState(0)
  const final = phase === 3
  const remaining = 4 - actions
  const introComplete = introChars >= introText.length
  const instructionsComplete = instructionChars >= instructionsText.length

  const applyPendingPhase = () => {
    if (pendingPhase === null) return
    const nextPhase = pendingPhase
    setPhase(nextPhase)
    setActions(0)
    setPendingPhase(null)
    setFadingDot(null)
    setLocked(false)
    if (nextPhase === 3) {
      setScene('station')
      setFinalIntro(true)
        setTimeout(() => setFinalIntro(false), 5000)
    }
  }
  const closeInvestigation = () => {
    setSelected(null)
    setEnvironmental(null)
    applyPendingPhase()
  }

  useEffect(() => {
    const isIntro = mode === 'intro'
    const isInstructions = mode === 'instructions'
    if (!isIntro && !isInstructions) return
    const text = isIntro ? introText : instructionsText
    const count = isIntro ? introChars : instructionChars
    if (count >= text.length) return
    const character = text[count]
    const delay = character === '\n' ? 260 : '，。'.includes(character) ? 160 : character === '…' ? 240 : 48
    const timer = window.setTimeout(() => isIntro ? setIntroChars(value => value + 1) : setInstructionChars(value => value + 1), delay)
    return () => window.clearTimeout(timer)
  }, [mode, introChars, instructionChars])

  useEffect(() => {
    const text = successMessage ? successEndingText : finalFailed ? failureEndingText : ''
    if (!text || endingChars >= text.length) return
    const character = text[endingChars]
    const delay = character === '\n' ? 280 : '，。'.includes(character) ? 140 : 42
    const timer = window.setTimeout(() => setEndingChars(value => value + 1), delay)
    return () => window.clearTimeout(timer)
  }, [successMessage, finalFailed, endingChars])

  useEffect(() => {
    if (!storyOpen || storyChars >= storyText.length) return
    const character = storyText[storyChars]
    const delay = character === '\n' ? 220 : '，。'.includes(character) ? 130 : character === '…' ? 210 : 38
    const timer = window.setTimeout(() => setStoryChars(value => value + 1), delay)
    return () => window.clearTimeout(timer)
  }, [storyOpen, storyChars])

  useEffect(() => {
    if (phase !== 3) return
    setFlicker(true)
    const timer = window.setTimeout(() => setFlicker(false), 1000)
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (!BGM_ENABLED) return
    const audio = new Audio('/assets/audio/the-sixth-station.mp3')
    audio.loop = true
    audio.volume = 0.5
    audio.preload = 'auto'
    bgmRef.current = audio
    return () => {
      audio.pause()
      audio.src = ''
      bgmRef.current = null
    }
  }, [])

  const startBgm = () => {
    if (!BGM_ENABLED) return
    const audio = bgmRef.current
    if (!audio || !audio.paused) return
    void audio.play().catch(() => undefined)
  }
  const stopBgm = () => {
    const audio = bgmRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
  }

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') closeInvestigation() }
    addEventListener('keydown', close)
    return () => removeEventListener('keydown', close)
  }, [pendingPhase])

  const advance = () => {
    setLocked(true)
    setPendingPhase((phase + 1) as Phase)
    setFlicker(true)
    setNotice('看得越仔细，时间过得越快')
    setTimeout(() => setFlicker(false), 850)
    setTimeout(() => setNotice(''), 2200)
  }
  const inspect = (id: ObjectId) => {
    if (ending || locked || selected) return
    if (final) {
      if (!mainObjects.has(id)) setSelected(id)
      return
    }
    setSelected(id)
    if (!mainObjects.has(id)) return
    if (inspectedAt[id] === phase) return
    setInspectedAt(values => ({ ...values, [id]: phase }))
    const next = actions + 1
    const required = phase === 0 ? 6 : 4
    setActions(next)
    if (phase === 1 || phase === 2) {
      setFadingDot(actions)
      setTimeout(() => setFadingDot(current => current === actions ? null : current), 420)
    }
    if (next === required) advance()
  }
  const chooseFinalAction = (option: { correct?: boolean; feedback?: string }) => {
    if (!final || finalFeedback || finalFailed || finalSuccess) return
    setFinalChoice(null)
    if (option.correct) {
      setFinalSuccess(true)
      setLocked(true)
      setFlicker(true)
      setTimeout(() => setFlicker(false), 220)
      setTimeout(() => setFlicker(true), 430)
      setTimeout(() => setFlicker(false), 700)
      setTimeout(() => setSuccessScene(true), 720)
      setTimeout(() => { setEndingChars(0); setSuccessMessage(true) }, 2720)
      return
    }
    setFinalFeedback(option.feedback ?? '')
    setTimeout(() => {
      setFinalFeedback(null)
      const next = actions + 1
      setActions(next)
      if (next >= 3) setTimeout(() => { setEndingChars(0); setFinalFailed(true) }, 260)
    }, 4000)
  }
  const restart = () => {
    stopBgm()
    setMode('title'); setTitleLeaving(false); setIntroLeaving(false); setIntroChars(0); setInstructionChars(0)
    setScene('overview'); setPhase(0); setActions(0); setSelected(null); setEnvironmental(null)
    setHeld(false); setNotice(''); setFlicker(false); setEnding(null); setLocked(false); setCovered(false); setInspectedAt({}); setPendingPhase(null); setFadingDot(null); setFinalIntro(false); setFinalChoice(null); setFinalFeedback(null); setFinalFailed(false); setFinalSuccess(false); setSuccessScene(false); setSuccessMessage(false); setEndingChars(0); setStoryOpen(false); setStoryChars(0)
  }
  const retryInvestigation = () => {
    setTitleLeaving(false); setIntroLeaving(false)
    setScene('overview'); setPhase(0); setActions(0); setSelected(null); setEnvironmental(null); setHeld(false); setNotice(''); setFlicker(false); setEnding(null); setLocked(false); setCovered(false); setInspectedAt({}); setPendingPhase(null); setFadingDot(null); setFinalIntro(false); setFinalChoice(null); setFinalFeedback(null); setFinalFailed(false); setFinalSuccess(false); setSuccessScene(false); setSuccessMessage(false); setEndingChars(0); setStoryOpen(false); setStoryChars(0)
    setInstructionChars(instructionsText.length)
    setMode('instructions')
  }
  const go = (id: string, object?: ObjectId, kind?: string, text?: string) => {
    if (final && (finalIntro || finalChoice || finalFeedback || finalFailed || finalSuccess)) return
    if (final && id === 'rules') return
    if (final && object && mainObjects.has(object)) { setFinalChoice(object); return }
    if (kind === 'env') { setEnvironmental(text ?? ''); return }
    if (id === 'station') setScene('station')
    else if (id === 'bed' && object) inspect(object)
    else if (id === 'mirror') inspect('mirror')
    else if (object) inspect(object)
  }
  const start = () => {
    if (titleLeaving) return
    setTitleLeaving(true)
    setTimeout(() => { setIntroChars(0); setMode('intro'); setTitleLeaving(false) }, 1800)
  }
  const enterDorm = () => {
    if (!introComplete || introLeaving) return
    setIntroLeaving(true)
    setTimeout(() => { setInstructionChars(0); setIntroLeaving(false); setMode('instructions') }, 700)
  }
  const startInvestigation = () => {
    if (!instructionsComplete || introLeaving) return
    startBgm()
    setIntroLeaving(true)
    setTimeout(() => { setMode('playing'); setIntroLeaving(false) }, 700)
  }

  if (mode === 'title') return <main className={`title-screen ${titleLeaving ? 'leaving' : ''}`}><img src={scenes.overview.asset} alt="深夜的宿舍" /><div className="title-shade" /><section className="title-copy"><h1><img src="/assets/ui/title_logo_final.png" alt="宿舍怪谈" /></h1><p>“你确定，一开始就是这样吗？”</p><button onClick={start}>开始游戏</button></section>{DEBUG && <pre className="title-debug">mode: title</pre>}</main>

  if (mode === 'intro') return <main className={`intro-screen ${introLeaving ? 'leaving' : ''}`}><img src={scenes.overview.asset} alt="深夜的宿舍" /><div className="intro-shade" /><section className="intro-dialog" onClick={() => { if (!introComplete) setIntroChars(introText.length) }} aria-label="开场独白"><p>{introText.slice(0, introChars)}{!introComplete && <span className="typing-caret" />}</p>{introComplete && <button onClick={event => { event.stopPropagation(); enterDorm() }}>回宿舍 <span>→</span></button>}</section></main>

  if (mode === 'instructions') return <main className={`intro-screen ${introLeaving ? 'leaving' : ''}`}><img src={scenes.overview.asset} alt="深夜的宿舍" /><div className="intro-shade" /><section className="intro-dialog instructions-dialog" onClick={() => { if (!instructionsComplete) setInstructionChars(instructionsText.length) }} aria-label="调查须知"><h2>调查须知</h2><p>{instructionsText.slice(0, instructionChars)}{!instructionsComplete && <span className="typing-caret" />}</p>{instructionsComplete && <button onClick={event => { event.stopPropagation(); startInvestigation() }}>开始调查 <span>→</span></button>}</section></main>

  if (storyOpen) return <main className="story-screen"><section className="story-dialog"><p>{storyText.slice(0, storyChars)}{storyChars < storyText.length && <span className="typing-caret" />}</p>{storyChars >= storyText.length && <button onClick={restart}>退出</button>}</section></main>

  const backdropClass = selected === 'bed' ? 'roommate-backdrop' : selected === 'photo' ? 'photo-backdrop' : selected === 'mirror' ? 'mirror-backdrop' : selected === 'phone' ? 'phone-backdrop' : selected === 'computer' || selected === 'notebook' || selected === 'rules' ? 'computer-backdrop' : ''
  return <main className={`game ${flicker ? 'flicker' : ''} ${selected ? 'inspecting' : ''}`}>
    <div className="scene-frame">
      <img className="scene-art" src={successScene ? '/assets/player_station_0011_no_mirror.png' : scenes[scene].asset} alt={successScene ? '没有镜子的宿舍书桌' : scenes[scene].alt} />
      {covered && scene === 'station' && <div className="temporary-mirror-cover" />}
      <div className={`clock ${scene === 'overview' ? 'overview-clock' : ''}`}><span>TIME</span>{successScene ? '00:11' : times[phase]}</div>
      {!finalSuccess && scenes[scene].hotspots.filter(hotspot => hotspot.id !== 'blanket' && !(final && hotspot.id === 'rules')).map(hotspot => <button key={hotspot.id} aria-label={hotspot.tooltip} data-tip={hotspot.tooltip} data-nav={hotspot.kind === 'nav' || undefined} data-kind={hotspot.kind} className={`hotspot ${DEBUG ? 'debug' : ''}`} style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, width: `${hotspot.width}%`, height: `${hotspot.height}%` }} onClick={() => go(hotspot.id, hotspot.object, hotspot.kind, hotspot.observation)} />)}
      {scene === 'station' && <button className="back" onClick={() => setScene('overview')}>← 返回宿舍</button>}
      {DEBUG && <pre className="debug-readout">scene: {scene}{'\n'}phase: {times[phase]}{'\n'}actions: {actions}</pre>}
    </div>
    {(phase === 1 || phase === 2) && !ending && <div className="investigation-indicator" aria-label={`剩余 ${remaining} 次调查机会`}>
      {fadingDot !== null && <i className="investigation-dot fading" />}
      {Array.from({ length: Math.max(remaining, 0) }, (_, index) => <i className="investigation-dot" key={index} />)}
    </div>}
    {final && !finalIntro && !finalFailed && !finalSuccess && <div className="final-indicator" aria-label={`剩余 ${Math.max(3 - actions, 0)} 次最终行动机会`}>{Array.from({ length: Math.max(3 - actions, 0) }, (_, index) => <i key={index} />)}</div>}
    {held && <div className="held">毯子</div>}{notice && <div className="notice">{notice}</div>}
    {selected && !ending && <div className={`inspection-backdrop ${backdropClass}`} onClick={closeInvestigation}>
      {selected === 'bed' ? <section className="roommate-inspection"><div className="art-frame"><img src={roommateAsset(phase)} alt="熟睡的室友" /><div className="art-hit-area" onClick={event => event.stopPropagation()} /></div><p onClick={event => event.stopPropagation()}>{observation(selected, phase)}</p></section>
        : selected === 'photo' ? <section className="photo-inspection"><div className="art-frame"><img src={photoAsset(phase)} alt="宿舍合照" /><div className="art-hit-area" onClick={event => event.stopPropagation()} /></div><p onClick={event => event.stopPropagation()}>{observation(selected, phase)}</p></section>
        : selected === 'phone' ? <section className="phone-inspection"><div className="phone-lens" onClick={event => event.stopPropagation()}><img src={phoneAsset(phase)} alt="寝室群聊天记录" /></div><div className="phone-handle" onClick={event => event.stopPropagation()} /><p onClick={event => event.stopPropagation()}>{observation(selected, phase)}</p></section>
        : selected === 'computer' ? <section className="computer-inspection"><img src={computerAsset(phase)} alt="电脑桌面" onClick={event => event.stopPropagation()} /><p onClick={event => event.stopPropagation()}>{observation(selected, phase)}</p></section>
        : selected === 'notebook' ? <section className="notebook-inspection"><img src={notebookAsset(phase)} alt="课程笔记" onClick={event => event.stopPropagation()} /><p onClick={event => event.stopPropagation()}>{observation(selected, phase)}</p></section>
        : selected === 'rules' ? <section className="rules-inspection"><img src="/assets/investigations/rules_note.png" alt="镜子规则纸条" onClick={event => event.stopPropagation()} /><p onClick={event => event.stopPropagation()}>{observation(selected, phase)}</p></section>
        : selected === 'mirror' ? <section className="mirror-inspection"><img src={mirrorAsset(phase)} alt="宿舍镜子" onClick={event => event.stopPropagation()} /><p onClick={event => event.stopPropagation()}>{observation(selected, phase)}</p></section>
        : <section className="magnifier"><div className="lens" onClick={event => event.stopPropagation()}><img src="/assets/closeup_placeholder.svg" alt={`${selected} close-up placeholder`} /></div><div className="handle" onClick={event => event.stopPropagation()} /><p onClick={event => event.stopPropagation()}>{observation(selected, phase)}</p></section>}
    </div>}
    {environmental !== null && <div className="environmental-focus" onClick={closeInvestigation}><p onClick={event => event.stopPropagation()}>{environmental}</p></div>}
    {finalIntro && <div className="final-intro"><p>现在，请开始你的最终行动</p></div>}
    {finalChoice && <div className="final-choice-backdrop" onClick={() => setFinalChoice(null)}><section onClick={event => event.stopPropagation()}>{finalActionOptions[finalChoice]?.map(option => <button key={option.label} onClick={() => chooseFinalAction(option)}>{option.label}</button>)}</section></div>}
    {finalFeedback && <div className="final-feedback-screen"><section>{finalFeedback.split('\n').map(line => <p key={line}>{line}</p>)}</section></div>}
    {successMessage && <div className="final-success"><section><p>{successEndingText.slice(0, endingChars).split('\n').map(line => <span key={line}>{line}</span>)}{endingChars < successEndingText.length && <i className="typing-caret" />}</p>{endingChars >= successEndingText.length && <button onClick={() => { setStoryChars(0); setStoryOpen(true) }}>剧情解读 <span>→</span></button>}</section></div>}
    {finalFailed && <div className="final-failure"><section><p>{failureEndingText.slice(0, endingChars).split('\n').map(line => <span key={line}>{line}</span>)}{endingChars < failureEndingText.length && <i className="typing-caret" />}</p>{endingChars >= failureEndingText.length && <div className="ending-actions"><button onClick={retryInvestigation}>重新调查</button><button onClick={restart}>退出</button></div>}</section></div>}
    {ending && <div className="ending"><section><small>{ending === 'good' ? '00:11' : '00:10'}</small><h1>{ending === 'good' ? 'GOOD END' : 'BAD END — REPLACED'}</h1><p>{ending === 'good' ? '你还在这里。' : '房间为另一个人安静下来。'}</p><button onClick={restart}>{ending === 'good' ? '重新开始' : '重试'}</button></section></div>}
  </main>
}
