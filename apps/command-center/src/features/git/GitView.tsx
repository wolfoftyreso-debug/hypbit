/**
 * Git View — Repository Version Thumbnails
 *
 * Layout per repo:
 *   ARKIV (prev)   |   LIVE 🟢🔒 (production)   |   DEV (staging/next)
 *   ← left                  center                      right →
 *
 * Click thumbnail → opens Cockpit for that version
 */
import { useState, useRef } from 'react'
import { useApi } from '../../shared/auth/useApi'

interface Version {
  id: string
  slot: 'archive' | 'live' | 'dev'
  version: string
  url: string
  commit?: string
  deployed_at?: string
}

interface Repo {
  id: string
  domain: string
  repo_url: string
  status: 'live' | 'dev' | 'offline' | 'archive'
  versions: Version[]
}

// ── Lock SVG ──────────────────────────────────────────────────────────────────
const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{display:'inline'}}>
    <rect x="3" y="11" width="18" height="11" rx="2" fill="#0A3D62" stroke="#E8B84B" strokeWidth="1.5"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#0A3D62" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1.5" fill="#E8B84B"/>
  </svg>
)

// ── Inline Cockpit (shown when thumbnail is clicked) ──────────────────────────
function InlineCockpit({ url, label, isLive, onClose }: {
  url: string; label: string; isLive: boolean; onClose: () => void
}) {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'#050510', display:'flex', flexDirection:'column',
      fontFamily:'system-ui,sans-serif',
    }}>
      {/* Top bar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 20px', background:'#0A0A1A',
        borderBottom:'1px solid rgba(232,184,75,.2)',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:isLive?'#00FF88':'#FFB800',
            boxShadow:isLive?'0 0 6px #00FF88':'0 0 6px #FFB800'}} />
          <span style={{color:'#E8B84B',fontFamily:'monospace',fontSize:13,fontWeight:700,letterSpacing:'.1em'}}>
            COCKPIT — {label.toUpperCase()}
          </span>
          {!isLive && (
            <span style={{background:'#332200',color:'#FFB800',padding:'2px 8px',borderRadius:3,fontSize:9,fontFamily:'monospace',fontWeight:700}}>
              SANDBOX
            </span>
          )}
        </div>
        <button onClick={onClose} style={{
          background:'#E8B84B',border:'none',color:'#0A0A1A',
          padding:'5px 14px',borderRadius:5,cursor:'pointer',fontSize:12,fontWeight:700,
        }}>✕ CLOSE</button>
      </div>

      {/* Content: iframe + side panel */}
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 340px',overflow:'hidden'}}>
        {/* Live preview */}
        <div style={{position:'relative',overflow:'hidden'}}>
          {url ? (
            <iframe
              src={url}
              style={{width:'100%',height:'100%',border:'none'}}
              sandbox={isLive?'allow-scripts allow-same-origin allow-forms':'allow-scripts'}
            />
          ) : (
            <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}>
              <span style={{fontSize:48}}>🚧</span>
              <span style={{color:'rgba(255,255,255,.4)',fontFamily:'monospace',fontSize:13}}>No URL configured for this version</span>
            </div>
          )}
          {!isLive && (
            <div style={{position:'absolute',bottom:16,left:0,right:0,textAlign:'center',pointerEvents:'none'}}>
              <span style={{background:'rgba(51,34,0,.9)',color:'#FFB800',padding:'6px 16px',borderRadius:6,fontFamily:'monospace',fontSize:11,fontWeight:700}}>
                ⚠ SANDBOX — Not connected to live systems
              </span>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{background:'#080818',borderLeft:'1px solid rgba(232,184,75,.12)',padding:16,overflow:'auto',display:'flex',flexDirection:'column',gap:16}}>
          {/* Site info */}
          <div>
            <div style={{fontSize:9,color:'rgba(255,255,255,.3)',letterSpacing:'.15em',textTransform:'uppercase',marginBottom:8}}>Deployment Info</div>
            <div style={{background:'#0A0A1A',borderRadius:6,padding:'10px 12px',fontFamily:'monospace',fontSize:11,color:'rgba(245,240,232,.7)',lineHeight:1.8}}>
              <div><span style={{color:'rgba(255,255,255,.3)'}}>URL: </span>{url || '—'}</div>
              <div><span style={{color:'rgba(255,255,255,.3)'}}>STATUS: </span>
                <span style={{color:isLive?'#00FF88':'#FFB800'}}>{isLive?'● LIVE':'○ SANDBOX'}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div>
            <div style={{fontSize:9,color:'rgba(255,255,255,.3)',letterSpacing:'.15em',textTransform:'uppercase',marginBottom:8}}>Controls</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {['🚀 Deployments','🗄 Database','🌐 CDN','🔐 Auth','📊 Monitoring','⚙️ Settings'].map(ctrl => (
                <button key={ctrl} style={{
                  background:'#0D0D28',border:'1px solid rgba(255,255,255,.1)',
                  color:'rgba(255,255,255,.6)',padding:'7px 12px',borderRadius:5,
                  cursor:'pointer',fontSize:11,fontFamily:'monospace',textAlign:'left',
                  transition:'all .15s',
                }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='#E8B84B';(e.currentTarget as HTMLElement).style.color='#E8B84B'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.1)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,.6)'}}
                >
                  {ctrl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────
function Thumb({ version, onClick }: { version: Version; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const slotStyle = {
    archive: { border:'rgba(10,61,98,.2)',  bg:'rgba(10,61,98,.04)', tag:'ARKIV',  tagColor:'rgba(10,61,98,.5)' },
    live:    { border:'rgba(45,122,79,.5)', bg:'rgba(45,122,79,.05)',tag:'LIVE',   tagColor:'#1A5C3A' },
    dev:     { border:'rgba(232,184,75,.4)',bg:'rgba(232,184,75,.06)',tag:'DEV',   tagColor:'#8B6914' },
  }[version.slot]

  return (
    <div
      onClick={onClick}
      style={{
        width: version.slot === 'live' ? 200 : 160,
        cursor:'pointer', borderRadius:10, overflow:'hidden',
        border:`1.5px solid ${slotStyle.border}`,
        background: slotStyle.bg,
        transition:'transform .15s, box-shadow .15s',
        flexShrink:0, position:'relative',
      }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLElement).style.boxShadow='0 8px 20px rgba(10,61,98,.12)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='';(e.currentTarget as HTMLElement).style.boxShadow=''}}
    >
      {/* Iframe preview */}
      <div style={{width:'100%',height: version.slot==='live'?120:90,overflow:'hidden',position:'relative',background:'#F5F0E8'}}>
        {!loaded && (
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#F5F0E8'}}>
            <span style={{fontSize:20}}>{version.slot==='live'?'🌐':version.slot==='dev'?'🔧':'📦'}</span>
          </div>
        )}
        {version.url && (
          <iframe
            ref={iframeRef}
            src={version.url}
            style={{
              width:'300%', height:'300%',
              transform:'scale(0.333)', transformOrigin:'top left',
              pointerEvents:'none', border:'none',
              display: loaded ? 'block' : 'none',
            }}
            onLoad={() => setLoaded(true)}
            sandbox="allow-scripts allow-same-origin"
            title={`${version.slot} ${version.version}`}
          />
        )}

        {/* Live badge */}
        {version.slot === 'live' && (
          <div style={{
            position:'absolute',top:6,right:6,
            background:'#2D7A4F',borderRadius:20,
            padding:'2px 8px',display:'flex',alignItems:'center',gap:4,
          }}>
            <div style={{width:5,height:5,borderRadius:'50%',background:'#7AE0A6',animation:'lp 2s infinite'}} />
            <span style={{fontSize:8,fontWeight:700,color:'white',fontFamily:'monospace'}}>LIVE</span>
          </div>
        )}

        {/* Hover overlay */}
        <div style={{
          position:'absolute',inset:0,
          background:'rgba(10,61,98,0)',
          display:'flex',alignItems:'center',justifyContent:'center',
          transition:'background .2s',
        }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(10,61,98,.4)'}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='rgba(10,61,98,0)'}
        >
          <span style={{fontSize:10,fontFamily:'monospace',fontWeight:700,color:'#E8B84B',opacity:0,transition:'opacity .2s',pointerEvents:'none'}}>
            ⬡ Cockpit
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{padding:'7px 10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize: version.slot==='live'?12:11,fontWeight:700,fontFamily:'monospace',color:'#0A3D62'}}>{version.version}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          {version.slot === 'live' && <LockIcon />}
          <span style={{fontSize:9,fontFamily:'monospace',fontWeight:700,color:slotStyle.tagColor}}>
            {slotStyle.tag}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Arrow ─────────────────────────────────────────────────────────────────────
const Arrow = () => (
  <div style={{display:'flex',alignItems:'center',padding:'0 6px',paddingTop:40,color:'rgba(10,61,98,.25)',fontSize:16,flexShrink:0}}>→</div>
)

// ── Repo Row ──────────────────────────────────────────────────────────────────
function RepoRow({ repo }: { repo: Repo }) {
  const [cockpit, setCockpit] = useState<Version|null>(null)

  const archive = repo.versions.filter(v => v.slot === 'archive')
  const live    = repo.versions.filter(v => v.slot === 'live')
  const dev     = repo.versions.filter(v => v.slot === 'dev')

  const dotColor = { live:'#2D7A4F', dev:'#2C3E6B', offline:'#B8760A', archive:'rgba(10,61,98,.3)' }[repo.status]

  return (
    <div style={{marginBottom:18,paddingBottom:18,borderBottom:'1px solid rgba(10,61,98,.07)'}}>
      {/* Repo label row */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,paddingLeft:2}}>
        <span style={{fontSize:11,color:'rgba(10,61,98,.35)',fontFamily:'monospace'}}>📁</span>
        <span style={{fontSize:13,fontWeight:700,fontFamily:'monospace',color:'#0A3D62'}}>{repo.domain}/</span>
        <a href={repo.repo_url} target="_blank" rel="noopener noreferrer"
           onClick={e=>e.stopPropagation()}
           style={{fontSize:9,color:'#E8B84B',fontFamily:'monospace',textDecoration:'none'}}>
          git ↗
        </a>
        <div style={{width:7,height:7,borderRadius:'50%',background:dotColor,marginLeft:4}} />
        <span style={{fontSize:9,fontFamily:'monospace',color:dotColor,textTransform:'uppercase'}}>{repo.status}</span>
      </div>

      {/* Three zones: ARKIV | LIVE | DEV */}
      <div style={{display:'flex',alignItems:'flex-start',gap:0,overflow:'auto',paddingBottom:4}}>

        {/* ARCHIVE zone (left) */}
        <div style={{display:'flex',alignItems:'center',minWidth:archive.length>0?'auto':'40px'}}>
          {archive.length > 0 ? (
            archive.map((v,i) => (
              <div key={v.id} style={{display:'flex',alignItems:'center'}}>
                {i > 0 && <Arrow />}
                <Thumb version={v} onClick={() => setCockpit(v)} />
              </div>
            ))
          ) : (
            <div style={{width:40,height:90,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontSize:16,opacity:.2}}>—</span>
            </div>
          )}
          {archive.length > 0 && <Arrow />}
        </div>

        {/* LIVE zone (center) */}
        <div style={{display:'flex',alignItems:'center'}}>
          {live.length > 0 ? (
            live.map(v => <Thumb key={v.id} version={v} onClick={() => setCockpit(v)} />)
          ) : (
            <div style={{
              width:200,height:120,border:'1.5px dashed rgba(10,61,98,.15)',
              borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',
              background:'rgba(10,61,98,.02)',flexShrink:0,
            }}>
              <span style={{fontSize:11,color:'rgba(10,61,98,.3)',fontFamily:'monospace'}}>No live version</span>
            </div>
          )}
        </div>

        {/* DEV zone (right) */}
        <div style={{display:'flex',alignItems:'center'}}>
          {dev.length > 0 && <Arrow />}
          {dev.map((v,i) => (
            <div key={v.id} style={{display:'flex',alignItems:'center'}}>
              {i > 0 && <Arrow />}
              <Thumb version={v} onClick={() => setCockpit(v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Cockpit overlay */}
      {cockpit && (
        <InlineCockpit
          url={cockpit.url}
          label={`${repo.domain} ${cockpit.version}`}
          isLive={cockpit.slot === 'live'}
          onClose={() => setCockpit(null)}
        />
      )}
    </div>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
const DEFAULT_REPOS: Repo[] = [
  {
    id:'wavult-os', domain:'os.wavult.com', status:'live',
    repo_url:'https://git.wavult.com/wavult/wavult-os',
    versions:[
      { id:'os-prev', slot:'archive', version:'v2.x', url:'' },
      { id:'os-live', slot:'live',    version:'v3.0', url:'https://os.wavult.com', deployed_at: new Date().toISOString() },
      { id:'os-dev',  slot:'dev',     version:'v3.1-dev', url:'https://wavult-os-dev.pages.dev' },
    ]
  },
  {
    id:'quixzoom', domain:'quixzoom.com', status:'live',
    repo_url:'https://git.wavult.com/wavult/quixzoom.com',
    versions:[
      { id:'qz-live', slot:'live', version:'v1.0', url:'https://quixzoom.com' },
      { id:'qz-dev',  slot:'dev',  version:'v1.1-dev', url:'' },
    ]
  },
  {
    id:'landvex', domain:'landvex.com', status:'live',
    repo_url:'https://git.wavult.com/wavult/landvex.com',
    versions:[
      { id:'lv-live', slot:'live', version:'v1.0', url:'https://landvex.com' },
    ]
  },
  {
    id:'wavult-com', domain:'wavult.com', status:'live',
    repo_url:'https://git.wavult.com/wavult/wavult.com',
    versions:[
      { id:'wv-live', slot:'live', version:'v1.0', url:'https://wavult.com' },
    ]
  },
  {
    id:'supportfounds', domain:'supportfounds.com', status:'dev',
    repo_url:'https://git.wavult.com/wavult/wavult.com',
    versions:[
      { id:'sf-dev', slot:'dev', version:'v1.0-dev', url:'https://d14gf6x22fx96q.cloudfront.net/supportfounds/index.html' },
    ]
  },
  {
    id:'lunina', domain:'luninafoundation.pages.dev', status:'live',
    repo_url:'https://git.wavult.com/wavult/luninafoundation.org',
    versions:[
      { id:'lf-live', slot:'live', version:'v1.0', url:'https://lunina-foundation.pages.dev' },
    ]
  },
  {
    id:'mlcs', domain:'mlcs.com', status:'offline',
    repo_url:'https://git.wavult.com/wavult/mlcs.com',
    versions:[
      { id:'ml-dev', slot:'dev', version:'v1.0-dev', url:'' },
    ]
  },
  {
    id:'cert', domain:'certintegrity.com', status:'offline',
    repo_url:'https://git.wavult.com/wavult/cert-integrity-engine',
    versions:[
      { id:'ci-dev', slot:'dev', version:'v1.0-dev', url:'' },
    ]
  },
]

export function GitView() {
  const { apiFetch } = useApi()
  const [repos, setRepos] = useState<Repo[]>(DEFAULT_REPOS)
  const [loading, setLoading] = useState(false)

  return (
    <div style={{padding:'0 0 40px',fontFamily:'system-ui,sans-serif'}}>
      {/* Header */}
      <div style={{
        background:'linear-gradient(135deg,#0A3D62,#0d4d78)',
        borderRadius:12,padding:'20px 24px',marginBottom:20,
        display:'flex',alignItems:'center',justifyContent:'space-between',
      }}>
        <div>
          <div style={{fontSize:9,fontFamily:'monospace',color:'rgba(232,184,75,.7)',letterSpacing:'.15em',textTransform:'uppercase',marginBottom:6}}>
            Repositories & Deployments
          </div>
          <h2 style={{fontSize:18,fontWeight:800,color:'#F5F0E8',margin:0}}>
            Git — {repos.filter(r=>r.status==='live').length} live · {repos.filter(r=>r.status!=='live').length} other
          </h2>
          <p style={{fontSize:11,color:'rgba(245,240,232,.45)',margin:'4px 0 0',fontFamily:'monospace'}}>
            ARKIV → LIVE 🟢🔒 → DEV &nbsp;·&nbsp; Click thumbnail to open Cockpit
          </p>
        </div>
        <a href="https://git.wavult.com/wavult" target="_blank" rel="noopener noreferrer"
           style={{padding:'7px 16px',borderRadius:6,background:'rgba(232,184,75,.15)',border:'1px solid rgba(232,184,75,.35)',
             color:'#E8B84B',fontSize:11,fontFamily:'monospace',textDecoration:'none',fontWeight:700}}>
          Open Gitea ↗
        </a>
      </div>

      {/* Legend */}
      <div style={{display:'flex',gap:20,marginBottom:16,padding:'8px 14px',background:'#FDFAF5',borderRadius:8,border:'1px solid rgba(10,61,98,.1)',flexWrap:'wrap',alignItems:'center',fontSize:11}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:28,height:16,borderRadius:4,border:'1.5px solid rgba(10,61,98,.2)',background:'rgba(10,61,98,.04)'}} />
          <span style={{color:'rgba(10,61,98,.6)'}}>ARKIV — previous</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:28,height:16,borderRadius:4,border:'1.5px solid rgba(45,122,79,.5)',background:'rgba(45,122,79,.05)'}} />
          <span style={{color:'rgba(10,61,98,.6)'}}>LIVE — production 🟢🔒</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:28,height:16,borderRadius:4,border:'1.5px solid rgba(232,184,75,.4)',background:'rgba(232,184,75,.06)'}} />
          <span style={{color:'rgba(10,61,98,.6)'}}>DEV — staging / next</span>
        </div>
      </div>

      {repos.map(repo => <RepoRow key={repo.id} repo={repo} />)}

      <style>{`@keyframes lp{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
