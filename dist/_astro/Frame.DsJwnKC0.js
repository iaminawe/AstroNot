import{l as O,p as g,i as P,s as X}from"./props.aXMLg_Cw.js";import{M as R,X as V,L as W,q as y,aw as or,ae as gr,ax as lr,p as nr,ay as Y,l as v,e as sr,f as x,h,a as p,i as br,k as yr,m as kr,b as G,g as H,j as s}from"./template.BzwSjzWE.js";import{t as ur,s as I}from"./bundle-mjs.CeAK-udx.js";import{e as J,b}from"./misc.CWyyJMwU.js";import{t as fr}from"./ToolbarButton.dnPUEiIo.js";import{i as cr}from"./lifecycle.BkPtREUI.js";import{c as vr}from"./index-client.l0DIw1lQ.js";function K(o,r,l){R(()=>{var k=V(()=>r(o,l?.())||{});if(l&&k?.update){var u=!1,d={};W(()=>{var e=l();y(e),u&&or(d,e)&&(d=e,k.update(e))}),u=!0}if(k?.destroy)return()=>k.destroy()})}function N(o,r){return o===r||o?.[lr]===r}function Q(o={},r,l,k){return R(()=>{var u,d;return W(()=>{u=d,d=[],V(()=>{o!==l(...d)&&(r(o,...d),u&&N(l(...u),o)&&r(null,...u))})}),()=>{gr(()=>{d&&N(l(...d),o)&&r(null,...d)})}}),o}const xr={gray:"bg-gray-50 dark:bg-gray-800",red:"bg-red-50 dark:bg-gray-800",yellow:"bg-yellow-50 dark:bg-gray-800 ",green:"bg-green-50 dark:bg-gray-800 ",indigo:"bg-indigo-50 dark:bg-gray-800 ",purple:"bg-purple-50 dark:bg-gray-800 ",pink:"bg-pink-50 dark:bg-gray-800 ",blue:"bg-blue-50 dark:bg-gray-800 ",light:"bg-gray-50 dark:bg-gray-700",dark:"bg-gray-50 dark:bg-gray-800",default:"bg-white dark:bg-gray-800",dropdown:"bg-white dark:bg-gray-700",navbar:"bg-white dark:bg-gray-900",navbarUl:"bg-gray-50 dark:bg-gray-800",form:"bg-gray-50 dark:bg-gray-700",primary:"bg-primary-50 dark:bg-gray-800 ",orange:"bg-orange-50 dark:bg-orange-800",none:""};function Mr(o,r){const l=O(r,["children","$$slots","$$events","$$legacy"]),k=O(l,["tag","color","rounded","border","shadow","node","use","options","role","transition","params","open"]);nr(r,!1);const u=()=>{};Y("background",!0);let d=g(r,"tag",24,()=>k.href?"a":"div"),e=g(r,"color",12,"default"),F=g(r,"rounded",8,!1),L=g(r,"border",8,!1),S=g(r,"shadow",8,!1),w=g(r,"node",28,()=>{}),T=g(r,"use",8,u),j=g(r,"options",24,()=>({})),z=g(r,"role",24,()=>{}),A=g(r,"transition",24,()=>{}),Z=g(r,"params",24,()=>({})),f=g(r,"open",8,!0);const B=vr(),$={gray:"text-gray-800 dark:text-gray-300",red:"text-red-800 dark:text-red-400",yellow:"text-yellow-800 dark:text-yellow-300",green:"text-green-800 dark:text-green-400",indigo:"text-indigo-800 dark:text-indigo-400",purple:"text-purple-800 dark:text-purple-400",pink:"text-pink-800 dark:text-pink-400",blue:"text-blue-800 dark:text-blue-400",light:"text-gray-700 dark:text-gray-300",dark:"text-gray-700 dark:text-gray-300",default:"text-gray-500 dark:text-gray-400",dropdown:"text-gray-700 dark:text-gray-200",navbar:"text-gray-700 dark:text-gray-200",navbarUl:"text-gray-700 dark:text-gray-400",form:"text-gray-900 dark:text-white",primary:"text-primary-800 dark:text-primary-400",orange:"text-orange-800 dark:text-orange-400",none:""},rr={gray:"border-gray-300 dark:border-gray-800 divide-gray-300 dark:divide-gray-800",red:"border-red-300 dark:border-red-800 divide-red-300 dark:divide-red-800",yellow:"border-yellow-300 dark:border-yellow-800 divide-yellow-300 dark:divide-yellow-800",green:"border-green-300 dark:border-green-800 divide-green-300 dark:divide-green-800",indigo:"border-indigo-300 dark:border-indigo-800 divide-indigo-300 dark:divide-indigo-800",purple:"border-purple-300 dark:border-purple-800 divide-purple-300 dark:divide-purple-800",pink:"border-pink-300 dark:border-pink-800 divide-pink-300 dark:divide-pink-800",blue:"border-blue-300 dark:border-blue-800 divide-blue-300 dark:divide-blue-800",light:"border-gray-500 divide-gray-500",dark:"border-gray-500 divide-gray-500",default:"border-gray-200 dark:border-gray-700 divide-gray-200 dark:divide-gray-700",dropdown:"border-gray-100 dark:border-gray-600 divide-gray-100 dark:divide-gray-600",navbar:"border-gray-100 dark:border-gray-700 divide-gray-100 dark:divide-gray-700",navbarUl:"border-gray-100 dark:border-gray-700 divide-gray-100 dark:divide-gray-700",form:"border-gray-300 dark:border-gray-700 divide-gray-300 dark:divide-gray-700",primary:"border-primary-500 dark:border-primary-200  divide-primary-500 dark:divide-primary-200 ",orange:"border-orange-300 dark:border-orange-800 divide-orange-300 dark:divide-orange-800",none:""};let M=kr();v(()=>y(f()),()=>{B(f()?"open":"close")}),v(()=>y(f()),()=>{B("show",f())}),v(()=>y(e()),()=>{e(e()??"default")}),v(()=>y(e()),()=>{Y("color",e())}),v(()=>(y(e()),y(F()),y(L()),y(S()),y(l)),()=>{yr(M,ur(xr[e()],$[e()],F()&&"rounded-lg",L()&&"border",rr[e()],S()&&"shadow-md",l.class))}),sr(),cr();var D=x(),ar=h(D);{var er=c=>{var m=x(),U=h(m);J(U,d,!1,(t,_)=>{K(t,(a,q)=>T()?.(a,q),j),Q(t,a=>w(a),()=>w());let C;G(()=>C=X(t,C,{role:z(),...k,class:H(M)})),fr(3,t,A,Z),s("click",t,function(a){b.call(this,r,a)}),s("mouseenter",t,function(a){b.call(this,r,a)}),s("mouseleave",t,function(a){b.call(this,r,a)}),s("focusin",t,function(a){b.call(this,r,a)}),s("focusout",t,function(a){b.call(this,r,a)});var n=x(),E=h(n);I(E,r,"default",{},null),p(_,n)}),p(c,m)},dr=(c,m)=>{{var U=t=>{var _=x(),C=h(_);J(C,d,!1,(n,E)=>{K(n,(i,ir)=>T()?.(i,ir),j),Q(n,i=>w(i),()=>w());let a;G(()=>a=X(n,a,{role:z(),...k,class:H(M)})),s("click",n,function(i){b.call(this,r,i)}),s("mouseenter",n,function(i){b.call(this,r,i)}),s("mouseleave",n,function(i){b.call(this,r,i)}),s("focusin",n,function(i){b.call(this,r,i)}),s("focusout",n,function(i){b.call(this,r,i)});var q=x(),tr=h(q);I(tr,r,"default",{},null),p(E,q)}),p(t,_)};P(c,t=>{f()&&t(U)},m)}};P(ar,c=>{A()&&f()?c(er):c(dr,!1)})}p(o,D),br()}export{Mr as F,K as a,Q as b};
