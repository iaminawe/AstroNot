import{p as a,i as A,s as et,r as tt,a as je,l as fe,b as at,c as I,d as Q}from"./props.aXMLg_Cw.js";import{p as ne,w as st,R as rt,v as be,b as B,g as r,a as l,i as ie,s as w,c as x,n as N,r as b,l as L,e as Se,f as Te,h as S,q as y,k as P,m as j,t as T,j as W,M as le,o as ve,d as J}from"./template.BzwSjzWE.js";import{s as oe}from"./render.BNGGSTsB.js";import{S as lt,L as ot,I as nt}from"./Section.CDXFHLHS.js";import{a as Be,t as V,s as ee}from"./bundle-mjs.CeAK-udx.js";import{i as De}from"./lifecycle.BkPtREUI.js";import{t as xe}from"./bundle-mjs.CSqCgoPn.js";import{B as ue}from"./Button.e7y1l-_P.js";import{F as me,a as Ee}from"./Frame.DsJwnKC0.js";import{s as Me,p as it}from"./event-modifiers.CdEA5IGF.js";import{b as Fe}from"./misc.CWyyJMwU.js";import{c as dt}from"./index-client.l0DIw1lQ.js";import{C as Le}from"./CloseButton.SG1eyEgO.js";import"./ToolbarButton.dnPUEiIo.js";var ct=be("<title> </title>"),ut=be("<desc> </desc>"),mt=be('<svg><!><!><path d="M2.038 5.61A2.01 2.01 0 0 0 2 6v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6c0-.12-.01-.238-.03-.352l-.866.65-7.89 6.032a2 2 0 0 1-2.429 0L2.884 6.288l-.846-.677Z"></path><path d="M20.677 4.117A1.996 1.996 0 0 0 20 4H4c-.225 0-.44.037-.642.105l.758.607L12 10.742 19.9 4.7l.777-.583Z"></path></svg>');function ft(E,e){ne(e,!0);const o=st("iconCtx")??{},p={xs:"w-3 h-3",sm:"w-4 h-4",md:"w-5 h-5",lg:"w-6 h-6",xl:"w-8 h-8"};let i=a(e,"size",19,()=>o.size||"md"),c=a(e,"color",19,()=>o.color||"currentColor"),f=a(e,"ariaLabel",3,"envelope solid"),z=tt(e,["$$slots","$$events","$$legacy","size","color","title","desc","class","ariaLabel"]),D=`${e.title?.id||""} ${e.desc?.id||""}`;const g=rt(()=>!!(e.title?.id||e.desc?.id));var u=mt();let s;var m=x(u);{var v=n=>{var h=ct(),F=x(h,!0);b(h),B(()=>{je(h,"id",e.title.id),oe(F,e.title.title)}),l(n,h)};A(m,n=>{e.title?.id&&e.title.title&&n(v)})}var d=w(m);{var M=n=>{var h=ut(),F=x(h,!0);b(h),B(()=>{je(h,"id",e.desc.id),oe(F,e.desc.desc)}),l(n,h)};A(d,n=>{e.desc?.id&&e.desc.desc&&n(M)})}N(2),b(u),B(n=>s=et(u,s,{xmlns:"http://www.w3.org/2000/svg",fill:c(),...z,class:n,"aria-label":f(),"aria-describedby":r(g)?D:void 0,viewBox:"0 0 24 24"}),[()=>xe("shrink-0",p[i()],e.class)]),l(E,u),ie()}const vt=`
  a[href], area[href], input:not([disabled]):not([tabindex='-1']),
  button:not([disabled]):not([tabindex='-1']),select:not([disabled]):not([tabindex='-1']),
  textarea:not([disabled]):not([tabindex='-1']),
  iframe, object, embed, *[tabindex]:not([tabindex='-1']):not([disabled]), *[contenteditable=true]
`,xt=E=>{const e=o=>{if(!(o.key==="Tab"||o.keyCode===9))return;const i=Array.from(E.querySelectorAll(vt)).filter(f=>f instanceof HTMLElement&&f.hidden!==!0);let c=i.indexOf(document.activeElement);c===-1&&o.shiftKey&&(c=0),c+=i.length+(o.shiftKey?-1:1),c%=i.length,i[c].focus(),o.preventDefault()};return document.addEventListener("keydown",e,!0),{destroy(){document.removeEventListener("keydown",e,!0)}}};var bt=T("<h3> </h3>"),gt=T("<!> <!>",1),ht=T('<!> <div role="document"><!> <!></div> <!>',1),yt=T('<div></div>  <div tabindex="-1" aria-modal="true" role="dialog"><div><!></div></div>',1);function _t(E,e){const o=Be(e),p=fe(e,["children","$$slots","$$events","$$legacy"]),i=fe(p,["open","title","size","color","placement","autoclose","outsideclose","dismissable","backdropClass","classBackdrop","dialogClass","classDialog","defaultClass","headerClass","classHeader","bodyClass","classBody","footerClass","classFooter"]);ne(e,!1);const c=j(),f=j(),z=j(),D=j(),g=j(),u=j();let s=a(e,"open",12,!1),m=a(e,"title",8,""),v=a(e,"size",8,"md"),d=a(e,"color",8,"default"),M=a(e,"placement",8,"center"),n=a(e,"autoclose",8,!1),h=a(e,"outsideclose",8,!1),F=a(e,"dismissable",8,!0),Z=a(e,"backdropClass",8,"fixed inset-0 z-40 bg-gray-900 bg-black/50 dark:bg-black/80"),te=a(e,"classBackdrop",24,()=>{}),ae=a(e,"dialogClass",8,"fixed top-0 start-0 end-0 h-modal md:inset-0 md:h-full z-50 w-full p-4 flex"),C=a(e,"classDialog",24,()=>{}),U=a(e,"defaultClass",8,"relative flex flex-col mx-auto"),q=a(e,"headerClass",8,"flex justify-between items-center p-4 md:p-5 rounded-t-lg"),ge=a(e,"classHeader",24,()=>{}),he=a(e,"bodyClass",8,"p-4 md:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain"),ye=a(e,"classBody",24,()=>{}),_e=a(e,"footerClass",8,"flex items-center p-4 md:p-5 space-x-3 rtl:space-x-reverse rounded-b-lg"),we=a(e,"classFooter",24,()=>{});const He=dt();function Ne(t){const H=document.createTreeWalker(t,NodeFilter.SHOW_ELEMENT);let K;for(;K=H.nextNode();)if(K instanceof HTMLElement){const k=K,[Y,de]=qe(k);(Y||de)&&(k.tabIndex=0)}t.focus()}const Ae=t=>{switch(t){case"top-left":return["justify-start","items-start"];case"top-center":return["justify-center","items-start"];case"top-right":return["justify-end","items-start"];case"center-left":return["justify-start","items-center"];case"center":return["justify-center","items-center"];case"center-right":return["justify-end","items-center"];case"bottom-left":return["justify-start","items-end"];case"bottom-center":return["justify-center","items-end"];case"bottom-right":return["justify-end","items-end"];default:return["justify-center","items-center"]}},Oe={xs:"max-w-md",sm:"max-w-lg",md:"max-w-2xl",lg:"max-w-4xl",xl:"max-w-7xl"},We=t=>{const H=t.target;n()&&H?.tagName==="BUTTON"&&X(t)},Ie=t=>{const H=t.target;h()&&H===t.currentTarget&&X(t)},X=t=>{t.preventDefault(),s(!1)},qe=t=>[t.scrollWidth>t.clientWidth&&["scroll","auto"].indexOf(getComputedStyle(t).overflowX)>=0,t.scrollHeight>t.clientHeight&&["scroll","auto"].indexOf(getComputedStyle(t).overflowY)>=0];function pe(t){if(t.key==="Escape"&&F())return X(t)}L(()=>y(s()),()=>{He(s()?"open":"close")}),L(()=>(y(Z()),y(te())),()=>{P(c,V(Z(),te()))}),L(()=>(y(ae()),y(C()),y(M())),()=>{P(f,V(ae(),C(),Ae(M())))}),L(()=>(y(U()),y(p)),()=>{P(z,V(U(),"w-full divide-y",p.class))}),L(()=>(y(q()),y(ge())),()=>{P(D,V(q(),ge()))}),L(()=>(y(he()),y(ye())),()=>{P(g,V(he(),ye()))}),L(()=>(y(_e()),y(we())),()=>{P(u,V(_e(),we()))}),Se(),De();var Ce=Te(),Ke=S(Ce);{var Re=t=>{var H=yt(),K=S(H),k=w(K,2),Y=x(k),de=x(Y);me(de,at({rounded:!0,shadow:!0},()=>i,{get class(){return r(z)},get color(){return d()},children:(O,Tt)=>{var ke=ht(),Pe=S(ke);{var Ve=_=>{me(_,{get class(){return r(D)},get color(){return d()},children:(ce,$e)=>{var $=gt(),se=S($);ee(se,e,"header",{},G=>{var re=bt(),Qe=x(re,!0);b(re),B(()=>{I(re,1,`text-xl font-semibold ${(d()==="default"?"":"text-gray-900 dark:text-white")??""} p-0`),oe(Qe,m())}),l(G,re)});var Ge=w(se,2);{var Je=G=>{Le(G,{name:"Close modal",get color(){return d()},$$events:{click:X}})};A(Ge,G=>{F()&&G(Je)})}l(ce,$)},$$slots:{default:!0}})};A(Pe,_=>{(o.header||m())&&_(Ve)})}var R=w(Pe,2),ze=x(R);{var Ze=_=>{Le(_,{name:"Close modal",class:"absolute top-3 end-2.5",get color(){return d()},$$events:{click:X}})};A(ze,_=>{F()&&!o.header&&!m()&&_(Ze)})}var Ue=w(ze,2);ee(Ue,e,"default",{},null),b(R);var Xe=w(R,2);{var Ye=_=>{me(_,{get class(){return r(u)},get color(){return d()},children:(ce,$e)=>{var $=Te(),se=S($);ee(se,e,"footer",{},null),l(ce,$)},$$slots:{default:!0}})};A(Xe,_=>{o.footer&&_(Ye)})}B(()=>I(R,1,Q(r(g)))),W("keydown",R,Me(pe)),W("wheel",R,Me(function(_){Fe.call(this,e,_)}),void 0,!0),l(O,ke)},$$slots:{default:!0}})),b(Y),b(k),le(()=>W("keydown",k,pe)),le(()=>W("wheel",k,it(function(O){Fe.call(this,e,O)}),void 0,!1)),Ee(k,O=>Ne?.(O)),Ee(k,O=>xt?.(O)),le(()=>W("click",k,We)),le(()=>W("mousedown",k,Ie)),B(()=>{I(K,1,Q(r(c))),I(k,1,Q(r(f))),I(Y,1,`flex relative ${Oe[v()]??""} w-full max-h-full`)}),l(t,H)};A(Ke,t=>{s()&&t(Re)})}l(E,Ce),ie()}var wt=T("<h2><!></h2>"),pt=T("<div><!> <!></div>");function Ct(E,e){const o=Be(e),p=fe(e,["children","$$slots","$$events","$$legacy"]);ne(e,!1);let i=a(e,"divClass",8,"mx-auto max-w-screen-md sm:text-center"),c=a(e,"h2Class",8,"mb-4 text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl dark:text-white");De();var f=pt(),z=x(f);{var D=u=>{var s=wt(),m=x(s);ee(m,e,"h2",{},null),b(s),B(v=>I(s,1,v),[()=>Q(xe(c(),p.classH2))],ve),l(u,s)};A(z,u=>{o.h2&&u(D)})}var g=w(z,2);ee(g,e,"default",{},null),b(f),B(u=>I(f,1,u),[()=>Q(xe(i(),p.class))],ve),l(E,f),ie()}var kt=T(`<p class="mx-auto mb-8 max-w-2xl font-light text-gray-500 dark:text-gray-400 sm:text-xl md:mb-12">Enter an e-mail address to test out form validation and Flowbite modal via
      reactive Svelte components. This form does <span class="font-bold">not</span> collect any data.</p> <form><div class="mx-auto mb-3 max-w-screen-sm items-center space-y-4 sm:flex sm:space-y-0"><div class="relative w-full"><!> <!></div> <div><!></div></div> <div class="newsletter-form-footer mx-auto max-w-screen-sm text-left text-sm text-gray-500 dark:text-gray-300">We care about the protection of your data. <a href="/" class="font-medium text-primary-600 hover:underline dark:text-primary-400">Read our Privacy Policy</a>.</div></form>`,1),Pt=T(`<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">Normally this would subscribe <span class="font-extrabold"> </span> to
    an e-mail list, but this is just a test for form validation and this interactive
    Modal component.</p> <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">Modals are just one of many available interactive Flowbite components
    already included in AstroNot. Check out the documentation for more details
    on Flowbite and Svelte components!</p>`,1),zt=T("<!> <!>",1),jt=T("<!> <!>",1);function Kt(E,e){ne(e,!1);const o=j(),p=j();let i=j(""),c=j(!1);L(()=>r(i),()=>{P(o,r(i).match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))}),L(()=>(r(i),r(o)),()=>{P(p,r(i).length===0?"base":r(o)?"green":"red")}),Se();var f=jt(),z=S(f);lt(z,{children:(g,u)=>{Ct(g,{children:(s,m)=>{var v=kt(),d=w(S(v),2),M=x(d),n=x(M),h=x(n);ot(h,{class:"hidden",children:(C,U)=>{N();var q=J("Email address");l(C,q)},$$slots:{default:!0}});var F=w(h,2);nt(F,{id:"email",type:"email",get color(){return r(p)},placeholder:"buzz@astronot.com",size:"md",class:"block w-full rounded-lg border border-gray-300 p-3 pl-10 text-sm focus:border-primary-500 focus:ring-primary-500 sm:rounded-none sm:rounded-l-lg",get value(){return r(i)},set value(C){P(i,C)},$$slots:{left:(C,U)=>{ft(C,{slot:"left",size:"sm",class:"ml-2 text-gray-500 dark:text-gray-400"})}},$$legacy:!0}),b(n);var Z=w(n,2),te=x(Z);const ae=ve(()=>!r(o));ue(te,{type:"submit",class:"w-full cursor-pointer rounded-lg border border-primary-600 bg-primary-300 px-5 py-3 text-center text-sm font-medium text-white focus:ring-4 dark:focus:ring-primary-800  sm:rounded-none sm:rounded-r-lg",get disabled(){return r(ae)},children:(C,U)=>{N();var q=J("Subscribe");l(C,q)},$$slots:{default:!0}}),b(Z),b(M),N(2),b(d),W("submit",d,C=>{P(c,!r(c)),C.preventDefault()}),l(s,v)},$$slots:{default:!0,h2:(s,m)=>{var v=J("Sign up for my newsletter");l(s,v)}}})},$$slots:{default:!0}});var D=w(z,2);_t(D,{title:"Flowbite Modal Test",autoclose:!0,get open(){return r(c)},set open(g){P(c,g)},children:(g,u)=>{var s=Pt(),m=S(s),v=w(x(m)),d=x(v,!0);b(v),N(),b(m),N(2),B(()=>oe(d,r(i))),l(g,s)},$$slots:{default:!0,footer:(g,u)=>{var s=zt(),m=S(s);ue(m,{$$events:{click:()=>alert('Handle "success"')},children:(d,M)=>{N();var n=J("I accept");l(d,n)},$$slots:{default:!0}});var v=w(m,2);ue(v,{color:"alternative",children:(d,M)=>{N();var n=J("Decline");l(d,n)},$$slots:{default:!0}}),l(g,s)}},$$legacy:!0}),l(E,f),ie()}export{Kt as default};
