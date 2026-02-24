import{R as te,j as n,r as l,t as P,S as Q,Q as se,a as re,b as ae}from"./trpcClient-pMmsmdKh.js";import{c as oe}from"./client-Bk89stmb.js";import{a as ie,s as ne,i as le,c as B}from"./sdk-D4_CDCb-.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const o of a)if(o.type==="childList")for(const s of o.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function r(a){const o={};return a.integrity&&(o.integrity=a.integrity),a.referrerPolicy&&(o.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?o.credentials="include":a.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(a){if(a.ep)return;a.ep=!0;const o=r(a);fetch(a.href,o)}})();class de extends te.Component{constructor(t){super(t),this.state={hasError:!1}}static getDerivedStateFromError(t){return{hasError:!0,error:t}}componentDidCatch(t,r){console.error("Extension error:",t,r)}render(){return this.state.hasError?n.jsxs("div",{className:"p-4 bg-red-900 text-white rounded-xl",children:[n.jsx("h2",{className:"font-bold",children:"Something went wrong"}),n.jsx("p",{className:"text-sm mt-2",children:this.state.error?.message}),n.jsx("button",{onClick:()=>this.setState({hasError:!1}),className:"mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded",children:"Try again"})]}):this.props.children}}const q=()=>{const[e,t]=l.useState(null),[r,i]=l.useState(!0);return l.useEffect(()=>{chrome.storage.session.get("session",a=>{a.session&&t(a.session),i(!1)})},[]),{session:e,loading:r}};let ce={data:""},ue=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||ce},me=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,pe=/\/\*[^]*?\*\/|  +/g,H=/\n+/g,N=(e,t)=>{let r="",i="",a="";for(let o in e){let s=e[o];o[0]=="@"?o[1]=="i"?r=o+" "+s+";":i+=o[1]=="f"?N(s,o):o+"{"+N(s,o[1]=="k"?"":t)+"}":typeof s=="object"?i+=N(s,t?t.replace(/([^,])+/g,d=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,u=>/&/.test(u)?u.replace(/&/g,d):d?d+" "+u:u)):o):s!=null&&(o=o.startsWith('--')?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),a+=N.p?N.p(o,s):o+":"+s+";")}return r+(t&&a?t+"{"+a+"}":a)+i},w={},J=e=>{if(typeof e=="object"){let t="";for(let r in e)t+=r+J(e[r]);return t}return e},fe=(e,t,r,i,a)=>{let o=J(e),s=w[o]||(w[o]=(u=>{let c=0,p=11;for(;c<u.length;)p=101*p+u.charCodeAt(c++)>>>0;return"go"+p})(o));if(!w[s]){let u=o!==e?e:(c=>{let p,f,g=[{}];for(;p=me.exec(c.replace(pe,""));)p[4]?g.shift():p[3]?(f=p[3].replace(H," ").trim(),g.unshift(g[0][f]=g[0][f]||{})):g[0][p[1]]=p[2].replace(H," ").trim();return g[0]})(e);w[s]=N(a?{["@keyframes "+s]:u}:u,r?"":"."+s)}let d=r&&w.g?w.g:null;return r&&(w.g=w[s]),((u,c,p,f)=>{f?c.data=c.data.replace(f,u):c.data.indexOf(u)===-1&&(c.data=p?u+c.data:c.data+u)})(w[s],t,i,d),s},ge=(e,t,r)=>e.reduce((i,a,o)=>{let s=t[o];if(s&&s.call){let d=s(r),u=d&&d.props&&d.props.className||d.startsWith('go')&&d;s=u?"."+u:d&&typeof d=="object"?d.props?"":N(d,""):d===!1?"":d}return i+a+(s??"")},"");function I(e){let t=this||{},r=e.call?e(t.p):e;return fe(r.unshift?r.raw?ge(r,[].slice.call(arguments,1),t.p):r.reduce((i,a)=>Object.assign(i,a&&a.call?a(t.p):a),{}):r,ue(t.target),t.g,t.o,t.k)}let Y,z,_;I.bind({g:1});let j=I.bind({k:1});function he(e,t,r,i){N.p=t,Y=e,z=r,_=i}function k(e,t){let r=this||{};return function(){let i=arguments;function a(o,s){let d=Object.assign({},o),u=d.className||a.className;r.p=Object.assign({theme:z&&z()},d),r.o=/ *go\d+/.test(u),d.className=I.apply(r,i)+(u?" "+u:"");let c=e;return e[0]&&(c=d.as||e,delete d.as),_&&c[0]&&_(d),Y(c,d)}return a}}var xe=e=>typeof e=="function",A=(e,t)=>xe(e)?e(t):e,be=(()=>{let e=0;return()=>(++e).toString()})(),K=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),ye=20,U="default",V=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(s=>s.id===t.toast.id?{...s,...t.toast}:s)};case 2:let{toast:i}=t;return V(e,{type:e.toasts.find(s=>s.id===i.id)?1:0,toast:i});case 3:let{toastId:a}=t;return{...e,toasts:e.toasts.map(s=>s.id===a||a===void 0?{...s,dismissed:!0,visible:!1}:s)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(s=>s.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(s=>({...s,pauseDuration:s.pauseDuration+o}))}}},O=[],W={toasts:[],pausedAt:void 0,settings:{toastLimit:ye}},y={},Z=(e,t=U)=>{y[t]=V(y[t]||W,e),O.forEach(([r,i])=>{r===t&&i(y[t])})},G=e=>Object.keys(y).forEach(t=>Z(e,t)),ve=e=>Object.keys(y).find(t=>y[t].toasts.some(r=>r.id===e)),R=(e=U)=>t=>{Z(t,e)},we={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},je=(e={},t=U)=>{let[r,i]=l.useState(y[t]||W),a=l.useRef(y[t]);l.useEffect(()=>(a.current!==y[t]&&i(y[t]),O.push([t,i]),()=>{let s=O.findIndex(([d])=>d===t);s>-1&&O.splice(s,1)}),[t]);let o=r.toasts.map(s=>{var d,u,c;return{...e,...e[s.type],...s,removeDelay:s.removeDelay||((d=e[s.type])==null?void 0:d.removeDelay)||e?.removeDelay,duration:s.duration||((u=e[s.type])==null?void 0:u.duration)||e?.duration||we[s.type],style:{...e.style,...(c=e[s.type])==null?void 0:c.style,...s.style}}});return{...r,toasts:o}},Ne=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:r?.id||be()}),S=e=>(t,r)=>{let i=Ne(t,e,r);return R(i.toasterId||ve(i.id))({type:2,toast:i}),i.id},x=(e,t)=>S("blank")(e,t);x.error=S("error");x.success=S("success");x.loading=S("loading");x.custom=S("custom");x.dismiss=(e,t)=>{let r={type:3,toastId:e};t?R(t)(r):G(r)};x.dismissAll=e=>x.dismiss(void 0,e);x.remove=(e,t)=>{let r={type:4,toastId:e};t?R(t)(r):G(r)};x.removeAll=e=>x.remove(void 0,e);x.promise=(e,t,r)=>{let i=x.loading(t.loading,{...r,...r?.loading});return typeof e=="function"&&(e=e()),e.then(a=>{let o=t.success?A(t.success,a):void 0;return o?x.success(o,{id:i,...r,...r?.success}):x.dismiss(i),a}).catch(a=>{let o=t.error?A(t.error,a):void 0;o?x.error(o,{id:i,...r,...r?.error}):x.dismiss(i)}),e};var ke=1e3,Ee=(e,t="default")=>{let{toasts:r,pausedAt:i}=je(e,t),a=l.useRef(new Map).current,o=l.useCallback((f,g=ke)=>{if(a.has(f))return;let h=setTimeout(()=>{a.delete(f),s({type:4,toastId:f})},g);a.set(f,h)},[]);l.useEffect(()=>{if(i)return;let f=Date.now(),g=r.map(h=>{if(h.duration===1/0)return;let E=(h.duration||0)+h.pauseDuration-(f-h.createdAt);if(E<0){h.visible&&x.dismiss(h.id);return}return setTimeout(()=>x.dismiss(h.id,t),E)});return()=>{g.forEach(h=>h&&clearTimeout(h))}},[r,i,t]);let s=l.useCallback(R(t),[t]),d=l.useCallback(()=>{s({type:5,time:Date.now()})},[s]),u=l.useCallback((f,g)=>{s({type:1,toast:{id:f,height:g}})},[s]),c=l.useCallback(()=>{i&&s({type:6,time:Date.now()})},[i,s]),p=l.useCallback((f,g)=>{let{reverseOrder:h=!1,gutter:E=8,defaultPosition:D}=g||{},C=r.filter(b=>(b.position||D)===(f.position||D)&&b.height),F=C.findIndex(b=>b.id===f.id),$=C.filter((b,m)=>m<F&&b.visible).length;return C.filter(b=>b.visible).slice(...h?[$+1]:[0,$]).reduce((b,m)=>b+(m.height||0)+E,0)},[r]);return l.useEffect(()=>{r.forEach(f=>{if(f.dismissed)o(f.id,f.removeDelay);else{let g=a.get(f.id);g&&(clearTimeout(g),a.delete(f.id))}})},[r,o]),{toasts:r,handlers:{updateHeight:u,startPause:d,endPause:c,calculateOffset:p}}},Ce=j`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,Pe=j`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Se=j`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,De=k("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Ce} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${Pe} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${Se} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,$e=j`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,Le=k("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${$e} 1s linear infinite;
`,Oe=j`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,Ae=j`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,Me=k("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Oe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${Ae} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,Ie=k("div")`
  position: absolute;
`,Re=k("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,Fe=j`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Te=k("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${Fe} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,Be=({toast:e})=>{let{icon:t,type:r,iconTheme:i}=e;return t!==void 0?typeof t=="string"?l.createElement(Te,null,t):t:r==="blank"?null:l.createElement(Re,null,l.createElement(Le,{...i}),r!=="loading"&&l.createElement(Ie,null,r==="error"?l.createElement(De,{...i}):l.createElement(Me,{...i})))},ze=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,_e=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,Ue="0%{opacity:0;} 100%{opacity:1;}",Qe="0%{opacity:1;} 100%{opacity:0;}",He=k("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,qe=k("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Je=(e,t)=>{let r=e.includes("top")?1:-1,[i,a]=K()?[Ue,Qe]:[ze(r),_e(r)];return{animation:t?`${j(i)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${j(a)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},Ye=l.memo(({toast:e,position:t,style:r,children:i})=>{let a=e.height?Je(e.position||t||"top-center",e.visible):{opacity:0},o=l.createElement(Be,{toast:e}),s=l.createElement(qe,{...e.ariaProps},A(e.message,e));return l.createElement(He,{className:e.className,style:{...a,...r,...e.style}},typeof i=="function"?i({icon:o,message:s}):l.createElement(l.Fragment,null,o,s))});he(l.createElement);var Ke=({id:e,className:t,style:r,onHeightUpdate:i,children:a})=>{let o=l.useCallback(s=>{if(s){let d=()=>{let u=s.getBoundingClientRect().height;i(e,u)};d(),new MutationObserver(d).observe(s,{subtree:!0,childList:!0,characterData:!0})}},[e,i]);return l.createElement("div",{ref:o,className:t,style:r},a)},Ve=(e,t)=>{let r=e.includes("top"),i=r?{top:0}:{bottom:0},a=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:K()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...i,...a}},We=I`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,L=16,X=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:i,children:a,toasterId:o,containerStyle:s,containerClassName:d})=>{let{toasts:u,handlers:c}=Ee(r,o);return l.createElement("div",{"data-rht-toaster":o||"",style:{position:"fixed",zIndex:9999,top:L,left:L,right:L,bottom:L,pointerEvents:"none",...s},className:d,onMouseEnter:c.startPause,onMouseLeave:c.endPause},u.map(p=>{let f=p.position||t,g=c.calculateOffset(p,{reverseOrder:e,gutter:i,defaultPosition:t}),h=Ve(f,g);return l.createElement(Ke,{id:p.id,key:p.id,onHeightUpdate:c.updateHeight,className:p.visible?We:"",style:h},p.type==="custom"?A(p.message,p):a?a(p):l.createElement(Ye,{toast:p,position:f}))}))},ee=x;function Ze(e){const t={...e};return ie(t,"react"),ne("react",{version:l.version}),le(t)}const Ge=({postText:e,setPostText:t,url:r,setUrl:i,handleFetchPreview:a,isFetchingPreview:o,ogData:s,handleCreatePost:d,isCreatingPost:u,onClose:c})=>n.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center",children:n.jsxs("div",{className:"bg-slate-900 text-white p-6 rounded-lg shadow-xl w-full max-w-lg",children:[n.jsx("h2",{className:"text-2xl font-bold mb-4",children:"Create a New Post"}),n.jsx("textarea",{className:"w-full bg-slate-800 border border-slate-700 rounded-md p-2 mb-4 text-white",placeholder:"What's on your mind?",value:e,onChange:p=>t(p.target.value)}),n.jsxs("div",{className:"flex gap-2 mb-4",children:[n.jsx("input",{type:"text",className:"w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-white",placeholder:"Enter a URL to create a link card",value:r,onChange:p=>i(p.target.value)}),n.jsx("button",{className:"bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded",onClick:a,disabled:o,children:o?"Fetching...":"Fetch Preview"})]}),s&&n.jsxs("div",{className:"border border-slate-700 rounded-md p-4 mb-4",children:[n.jsx("h3",{className:"text-lg font-bold",children:s.title}),n.jsx("p",{className:"text-slate-400",children:s.description}),s.imageUrl&&n.jsx("img",{src:s.imageUrl,alt:"Preview",className:"mt-2 rounded-md max-w-full h-auto"})]}),n.jsxs("div",{className:"flex justify-end gap-4",children:[n.jsx("button",{className:"bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded",onClick:c,children:"Cancel"}),n.jsx("button",{className:"bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded",onClick:d,disabled:!s||u,children:u?"Posting...":"Create Post"})]})]})}),Xe=({onClose:e})=>{const[t,r]=l.useState(""),[i,a]=l.useState(""),{session:o}=q(),{data:s,refetch:d,isFetching:u}=P.og.fetch.useQuery({url:i},{enabled:!1}),c=P.post.create.useMutation({onError:f=>{ee.error(`Failed to create post: ${f.message}`),B(f)}}),p=()=>{!s||!o||c.mutate({text:t,url:i,title:s.title,description:s.description,imageUrl:s.imageUrl,accessJwt:o.accessJwt,did:o.did,handle:o.handle,refreshJwt:o.refreshJwt},{onSuccess:()=>{e()}})};return n.jsxs(n.Fragment,{children:[n.jsx(Ge,{postText:t,setPostText:r,url:i,setUrl:a,handleFetchPreview:d,isFetchingPreview:u,ogData:s??null,handleCreatePost:p,isCreatingPost:c.isPending,onClose:e}),n.jsx(X,{})]})};Q&&Ze({dsn:Q,tracesSampleRate:1});const et=e=>{try{return new URL(`http://${e}`).hostname===e&&!e.includes("/")}catch{return!1}},M=new se({defaultOptions:{queries:{retry:2,retryDelay:e=>Math.min(1e3*2**e,1e4)}}}),tt=({children:e})=>n.jsx(re,{client:M,children:n.jsx(P.Provider,{client:ae,queryClient:M,children:e})}),st=()=>{const[e,t]=l.useState(""),[r,i]=l.useState(""),[a,o]=l.useState([]),[s,d]=l.useState(""),[u,c]=l.useState(""),[p,f]=l.useState(!1),{session:g}=q();l.useEffect(()=>{const m=v=>{const T="reason"in v?v.reason:v.error;B(T)};return window.addEventListener("unhandledrejection",m),window.addEventListener("error",m),()=>{window.removeEventListener("unhandledrejection",m),window.removeEventListener("error",m)}},[]);const h=P.auth.login.useMutation({onSuccess:()=>{M.invalidateQueries()},onError:m=>{ee.error(`Login failed: ${m.message}`),B(m)}}),E=P.auth.logout.useMutation({onSuccess:()=>{M.invalidateQueries()}});l.useEffect(()=>{if(h.isPending)c("Signing in to Bluesky");else if(g){const m=g?.handle??"";c(m?`Logged in as @${m}`:"Logged in")}else c("Not logged in")},[h.isPending,g]),l.useEffect(()=>{chrome.storage.session.get(["allowedDomains"],m=>{let v=["thehill.com","theroot.com","usanews.com"];m&&Array.isArray(m.allowedDomains)&&(v=m.allowedDomains),o(v)})},[]);const D=()=>{h.mutate({identifier:e,appPassword:r})},C=()=>{if(!s){c("Domain cannot be empty.");return}if(!et(s)){c("Invalid domain format.");return}if(a.includes(s)){c(`Domain ${s} already exists.`);return}const m=[...a,s];o(m),chrome.storage.session.set({allowedDomains:m}),d(""),c(`Domain added: ${s}`)},F=m=>{const v=a.filter(T=>T!==m);o(v),chrome.storage.session.set({allowedDomains:v}),c(`Domain removed: ${m}`)},$=!!g,b=g?.handle;return n.jsxs("div",{role:"region","aria-label":"Bluesky Link Card popup",className:"w-80 p-4 bg-slate-950 text-slate-100 text-sm",children:[n.jsx("div",{"aria-live":"polite",className:"sr-only",id:"popup-live",children:u}),n.jsx("h1",{className:"text-base font-semibold mb-2",children:"Bluesky Link Card"}),h.isPending&&n.jsx("div",{className:"text-xs text-slate-300 mb-2",children:"Signing in…"}),h.error&&n.jsx("div",{className:"text-xs text-red-400 mb-2",children:h.error.message}),$?n.jsxs("div",{className:"space-y-4",children:[n.jsxs("div",{className:"space-y-1",children:[n.jsxs("div",{children:["Logged in as ",n.jsxs("span",{className:"font-medium",children:["@",b]})]}),n.jsx("p",{className:"text-xs text-slate-400",children:"You can now create posts with rich link cards."})]}),n.jsxs("div",{className:"flex flex-col space-y-2",children:[n.jsx("button",{"aria-label":"Create a new post",type:"button",className:"w-full rounded bg-sky-600 py-2 text-sm font-medium hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500",onClick:()=>f(!0),children:"Create Post"}),n.jsx("button",{"aria-label":"Sign out of Bluesky",type:"button",className:"w-full rounded bg-slate-700 py-2 text-sm font-medium hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500",onClick:()=>E.mutate(),children:"Logout"})]})]}):n.jsxs("div",{className:"space-y-2 mb-4",children:[n.jsxs("label",{className:"block",children:[n.jsx("span",{className:"text-xs text-slate-300",children:"Bluesky handle"}),n.jsx("input",{id:"handle-input","aria-label":"Bluesky handle",className:"mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500",value:e,onChange:m=>t(m.target.value),placeholder:"you.bsky.social"})]}),n.jsxs("label",{className:"block",children:[n.jsx("span",{className:"text-xs text-slate-300",children:"App password"}),n.jsx("input",{id:"password-input","aria-label":"App password",type:"password",className:"mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500",value:r,onChange:m=>i(m.target.value),placeholder:"xxxx-xxxx-xxxx-xxxx"})]}),n.jsx("button",{"aria-label":"Sign in to Bluesky",type:"button",className:"mt-2 w-full rounded bg-sky-600 py-1 text-xs font-medium hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500",onClick:D,disabled:h.isPending,children:h.isPending?"Signing in…":"Sign in to Bluesky"})]}),n.jsxs("div",{className:"border-t border-slate-800 pt-2 mt-2",children:[n.jsx("h2",{className:"text-sm font-medium mb-2",children:"Allowed Domains"}),n.jsx("div",{role:"list","aria-label":"Allowed domains",className:"space-y-1 mb-2",children:a.map(m=>n.jsxs("div",{role:"listitem",className:"flex justify-between items-center",children:[n.jsx("span",{className:"text-xs",children:m}),n.jsx("button",{"aria-label":`Remove domain ${m}`,type:"button",className:"text-xs text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500",onClick:()=>F(m),children:"Remove"})]},m))}),n.jsxs("div",{className:"flex gap-1",children:[n.jsx("input",{"aria-label":"Add domain",id:"domain-input",className:"flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500",value:s,onChange:m=>d(m.target.value),placeholder:"example.com"}),n.jsx("button",{"aria-label":"Add domain",type:"button",className:"rounded bg-sky-600 px-2 py-1 text-xs font-medium hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500",onClick:C,children:"Add"})]})]}),n.jsx("div",{className:"border-t border-slate-800 pt-2 mt-2",children:n.jsx("a",{href:"https://bsky.app",target:"_blank",rel:"noreferrer",className:"text-xs text-sky-400 hover:underline",children:"Open Bluesky"})}),p&&n.jsx(Xe,{onClose:()=>f(!1)}),n.jsx(X,{})]})},rt=()=>{const e=document.getElementById("root");if(!e)return;oe.createRoot(e).render(n.jsx(de,{children:n.jsx(tt,{children:n.jsx(st,{})})}))};rt();
